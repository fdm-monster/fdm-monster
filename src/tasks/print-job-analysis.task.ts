import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TaskService } from "@/services/interfaces/task.interfaces";
import { PrintJobService } from "@/services/orm/print-job.service";
import { FileAnalysisService } from "@/services/file-analysis.service";
import { FileStorageService } from "@/services/file-storage.service";
import { Repository } from "typeorm";
import { PrintJob } from "@/entities/print-job.entity";
import { TypeormService } from "@/services/typeorm/typeorm.service";

/**
 * Background task to analyze pending print jobs
 * Runs periodically to extract metadata from uploaded files
 */
export class PrintJobAnalysisTask implements TaskService {
  logger: LoggerService;
  private readonly printJobRepository: Repository<PrintJob>;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printJobService: PrintJobService,
    private readonly fileAnalysisService: FileAnalysisService,
    private readonly fileStorageService: FileStorageService,
    typeormService: TypeormService,
  ) {
    this.logger = loggerFactory(PrintJobAnalysisTask.name);
    this.printJobRepository = typeormService.getDataSource().getRepository(PrintJob);
  }

  async run() {
    try {
      // Find all jobs that need analysis
      const pendingJobs = await this.printJobRepository.find({
        where: [
          { analysisState: "NOT_ANALYZED", status: "PENDING" },
          { analysisState: "ANALYZING" }, // Retry stuck analyzing jobs
        ],
        take: 10, // Process up to 10 jobs per run
      });

      if (pendingJobs.length === 0) {
        return;
      }

      this.logger.log(`Found ${pendingJobs.length} print job(s) to analyze`);

      for (const job of pendingJobs) {
        try {
          await this.analyzeJob(job);
        } catch (error) {
          this.logger.error(`Failed to analyze job ${job.id}: ${job.fileName}`, error);

          // Mark as failed
          job.analysisState = "FAILED";
          job.statusReason = `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`;
          await this.printJobRepository.save(job);
        }
      }

      this.logger.log(`Completed analysis of ${pendingJobs.length} print job(s)`);
    } catch (error) {
      this.logger.error("Failed to run print job analysis task", error);
    }
  }

  private async analyzeJob(job: PrintJob): Promise<void> {
    this.logger.log(`Analyzing print job ${job.id}: ${job.fileName}`);

    // Mark as analyzing
    job.analysisState = "ANALYZING";
    await this.printJobRepository.save(job);

    if (!job.fileStorageId) {
      throw new Error("Job has no fileStorageId - cannot analyze");
    }

    // Check if metadata JSON already exists (cached analysis)
    const cachedMetadata = await this.fileStorageService.loadMetadata(job.fileStorageId);

    let metadata;
    let thumbnails: any[] = [];

    if (cachedMetadata) {
      // Use cached metadata from JSON file (fast path - no re-analysis)
      this.logger.log(`Using cached metadata for job ${job.id} (storageId: ${job.fileStorageId})`);
      metadata = cachedMetadata;
      thumbnails = []; // Thumbnails not stored in JSON yet
    } else {
      // No cache - analyze the file
      const filePath = await this.resolveFilePath(job);

      if (!filePath) {
        throw new Error("File path could not be resolved");
      }

      // Check if file exists
      const exists = await this.fileAnalysisService.needsAnalysis(filePath);
      if (!exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Analyze the file
      const analysisResult = await this.fileAnalysisService.analyzeFile(filePath);
      metadata = analysisResult.metadata;
      thumbnails = analysisResult.thumbnails;

      // Save thumbnails
      let thumbnailMetadata: any[] = [];
      if (thumbnails && thumbnails.length > 0) {
        thumbnailMetadata = await this.fileStorageService.saveThumbnails(job.fileStorageId, thumbnails);
        this.logger.log(`Saved ${thumbnailMetadata.length} thumbnail(s) for job ${job.id}`);
      }

      // Cache metadata to JSON with thumbnail index
      const fileHash = job.fileHash || undefined;
      await this.fileStorageService.saveMetadata(job.fileStorageId, metadata, fileHash, job.fileName, thumbnailMetadata);
      this.logger.log(`Cached metadata JSON for job ${job.id}`);
    }

    // Update job with metadata through service (emits events)
    await this.printJobService.handleFileAnalyzed(job.id, metadata, thumbnails);

    this.logger.log(`Successfully analyzed job ${job.id}: ${job.fileName}`);
  }

  private async resolveFilePath(job: PrintJob): Promise<string | null> {
    // If job has fileStorageId, get file from storage
    if (job.fileStorageId) {
      try {
        const exists = await this.fileStorageService.fileExists(job.fileStorageId);
        if (!exists) {
          this.logger.warn(`File ${job.fileStorageId} not found in storage for job ${job.id}`);
          return null;
        }

        return this.fileStorageService.getFilePath(job.fileStorageId);
      } catch (error) {
        this.logger.error(`Failed to resolve file path for job ${job.id}: ${error}`);
        return null;
      }
    }

    // If no fileStorageId, we can't analyze (file is on printer, not locally)
    this.logger.debug(`Job ${job.id} has no fileStorageId - cannot analyze remotely stored file`);
    return null;
  }
}

