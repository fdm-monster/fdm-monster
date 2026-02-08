import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import EventEmitter2 from "eventemitter2";
import { PrintJobService } from "@/services/orm/print-job.service";
import { FileStorageService } from "@/services/file-storage.service";
import { FileAnalysisService } from "@/services/file-analysis.service";
import { PrinterApiFactory } from "@/services/printer-api.factory";
import { PrinterCache } from "@/state/printer.cache";
import { captureException } from "@sentry/node";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Service responsible for downloading files from printers for analysis
 * Handles the printJob.needsFileDownload event
 */
export class PrintFileDownloaderService {
  logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly printJobService: PrintJobService,
    private readonly fileStorageService: FileStorageService,
    private readonly fileAnalysisService: FileAnalysisService,
    private readonly printerApiFactory: PrinterApiFactory,
    private readonly printerCache: PrinterCache,
  ) {
    this.logger = loggerFactory(PrintFileDownloaderService.name);

    // Register event handler
    this.eventEmitter2.on("printJob.needsFileDownload", (event: { jobId: number }) => {
      this.handleFileDownloadRequest(event.jobId).catch((error) => {
        this.logger.error(`Failed to handle file download for job ${event.jobId}`, error);
        captureException(error);
      });
    });

    this.logger.log("Print file downloader service initialized");
  }

  private async handleFileDownloadRequest(jobId: number): Promise<void> {
    this.logger.log(`Handling file download request for job ${jobId}`);

    try {
      const job = await this.printJobService.getJobByIdOrFail(jobId);

      // Check if already has storage ID (race condition protection)
      if (job.fileStorageId) {
        this.logger.log(`Job ${jobId} already has fileStorageId ${job.fileStorageId} - skipping download`);
        return;
      }

      if (!job.printerId) {
        this.logger.error(`Job ${jobId} has no printerId - cannot download file`);
        return;
      }

      const printer = await this.printerCache.getValue(job.printerId);
      if (!printer) {
        this.logger.error(`Printer ${job.printerId} not found for job ${jobId}`);
        return;
      }

      // Get printer API
      const printerApi = this.printerApiFactory.getById(job.printerId);

      this.logger.log(`Downloading file ${job.fileName} from printer ${printer.name} (${printer.printerType})`);

      // Download file from printer
      let fileBuffer: Buffer;
      try {
        const response = await printerApi.downloadFile(job.fileName);

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        const stream = response.data;

        await new Promise<void>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(chunk));
          stream.on("end", () => resolve());
          stream.on("error", (err) => reject(err));
        });

        fileBuffer = Buffer.concat(chunks);
      } catch (downloadError) {
        this.logger.error(`Failed to download file from printer: ${downloadError}`);

        // Mark job as failed analysis
        job.analysisState = "FAILED";
        job.statusReason = `File download failed: ${downloadError instanceof Error ? downloadError.message : "Unknown error"}`;
        await this.printJobService.printJobRepository.save(job);
        return;
      }

      this.logger.log(`Downloaded ${fileBuffer.length} bytes for job ${jobId}`);

      // Create temporary file
      const tempPath = join(tmpdir(), `fdm-monster-download-${jobId}-${Date.now()}-${job.fileName}`);
      writeFileSync(tempPath, fileBuffer);

      try {
        // Calculate hash
        const fileHash = await this.fileStorageService.calculateFileHash(tempPath);
        this.logger.log(`File hash for job ${jobId}: ${fileHash.substring(0, 12)}...`);

        // Check for duplicate
        const existingJob = await this.fileStorageService.findDuplicateByHash(fileHash);

        let metadata;
        let fileStorageId: string;

        if (existingJob?.fileStorageId) {
          // Found duplicate - reuse existing storage
          const cachedMetadata = await this.fileStorageService.loadMetadata(existingJob.fileStorageId);

          if (cachedMetadata) {
            this.logger.log(
              `Duplicate file detected (job ${existingJob.id}, hash match) - reusing storage ${existingJob.fileStorageId}`,
            );
            metadata = {
              ...cachedMetadata,
              fileName: job.fileName,
            };
            fileStorageId = existingJob.fileStorageId;
          } else if (existingJob.analysisState === "ANALYZED" && existingJob.metadata) {
            this.logger.log(
              `Duplicate file with DB metadata (job ${existingJob.id}) - reusing storage ${existingJob.fileStorageId}`,
            );
            metadata = {
              ...existingJob.metadata,
              fileName: job.fileName,
            };
            fileStorageId = existingJob.fileStorageId;

            // Save metadata JSON for future
            await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, job.fileName);
          } else {
            // Duplicate hash but not analyzed - reuse storage, analyze file
            this.logger.log(
              `Duplicate file not analyzed - reusing storage ${existingJob.fileStorageId}, analyzing now`,
            );
            const existingFilePath = this.fileStorageService.getFilePath(existingJob.fileStorageId);
            const analysisResult = await this.fileAnalysisService.analyzeFile(existingFilePath);
            metadata = analysisResult.metadata;
            fileStorageId = existingJob.fileStorageId;
            await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, job.fileName);
          }
        } else {
          // New file - analyze and store
          this.logger.log(`Analyzing downloaded file: ${job.fileName}`);
          const analysisResult = await this.fileAnalysisService.analyzeFile(tempPath);
          metadata = analysisResult.metadata;
          const thumbnails = analysisResult.thumbnails;

          this.logger.log(
            `Analysis complete: format=${metadata.fileFormat}, layers=${metadata.totalLayers}, time=${metadata.gcodePrintTimeSeconds}s, filament=${metadata.filamentUsedGrams}g`,
          );

          // Save file to storage (with proper file object simulation)
          const fileObject = {
            path: tempPath,
            originalname: job.fileName,
            mimetype: "application/octet-stream",
            size: fileBuffer.length,
          } as Express.Multer.File;

          fileStorageId = await this.fileStorageService.saveFile(fileObject, fileHash);
          this.logger.log(`Saved file to storage: ${fileStorageId}`);

          let thumbnailMetadata: any[] = [];
          if (thumbnails.length > 0) {
            thumbnailMetadata = await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails);
            this.logger.log(`Saved ${thumbnailMetadata.length} thumbnail(s) for ${fileStorageId}`);
          }

          await this.fileStorageService.saveMetadata(
            fileStorageId,
            metadata,
            fileHash,
            job.fileName,
            thumbnailMetadata,
          );
          this.logger.log(`Saved metadata JSON for ${fileStorageId}`);
        }

        job.fileStorageId = fileStorageId;
        job.fileHash = fileHash;
        job.fileSize = fileBuffer.length;
        job.fileFormat = metadata.fileFormat;
        job.metadata = metadata;
        job.analysisState = "ANALYZED";
        job.analyzedAt = new Date();
        await this.printJobService.printJobRepository.save(job);

        this.logger.log(
          `Successfully processed downloaded file for job ${jobId}: storageId=${fileStorageId}, analysisState=${job.analysisState}`,
        );
      } finally {
        try {
          unlinkSync(tempPath);
        } catch (cleanupError) {
          this.logger.warn(`Failed to clean up temp file ${tempPath}: ${cleanupError}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to download and analyze file for job ${jobId}`, error);
      captureException(error);

      try {
        const job = await this.printJobService.printJobRepository.findOne({ where: { id: jobId } });
        if (job) {
          job.analysisState = "FAILED";
          job.statusReason = `File download/analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`;
          await this.printJobService.printJobRepository.save(job);
        }
      } catch (updateError) {
        this.logger.error(`Failed to mark job ${jobId} as failed`, updateError);
      }
    }
  }
}
