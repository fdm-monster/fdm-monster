import { before, DELETE, GET, POST, route } from "awilix-express";
import { authenticate, authorizeRoles, permission } from "@/middleware/authenticate";
import { validateInput } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import {
  downloadFileSchema,
  getFileSchema,
  startPrintFileSchema,
  uploadFileSchema,
} from "./validation/printer-files-controller.validation";
import { NotFoundException, ValidationException } from "@/exceptions/runtime.exceptions";
import { printerResolveMiddleware } from "@/middleware/printer";
import { PERMS, ROLES } from "@/constants/authorization.constants";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { MulterService } from "@/services/core/multer.service";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Request, Response } from "express";
import { BambuType, IPrinterApi } from "@/services/printer-api.interface";
import { PrinterThumbnailCache } from "@/state/printer-thumbnail.cache";
import { captureException } from "@sentry/node";
import { errorSummary } from "@/utils/error.utils";
import { getScopedPrinter } from "@/middleware/printer-resolver";
import { FileAnalysisService } from "@/services/file-analysis.service";
import { FileStorageService } from "@/services/file-storage.service";
import { copyFileSync, createReadStream, existsSync, unlinkSync } from "node:fs";
import { PrintJobService } from "@/services/orm/print-job.service";
import { extname } from "node:path";

@route(AppConstants.apiRoute + "/printer-files")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR]), printerResolveMiddleware()])
export class PrinterFilesController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerApi: IPrinterApi,
    private readonly printerFilesStore: PrinterFilesStore,
    private readonly printJobService: PrintJobService,
    private readonly fileAnalysisService: FileAnalysisService,
    private readonly fileStorageService: FileStorageService,
    private readonly multerService: MulterService,
    private readonly printerThumbnailCache: PrinterThumbnailCache,
  ) {
    this.logger = loggerFactory(PrinterFilesController.name);
  }

  @POST()
  @route("/purge")
  @before(permission(PERMS.PrinterFiles.Clear))
  async purgeIndexedFiles(req: Request, res: Response) {
    await this.printerFilesStore.purgeFiles();
    res.send();
  }

  @GET()
  @route("/thumbnails")
  @before(permission(PERMS.PrinterFiles.Get))
  async getThumbnails(req: Request, res: Response) {
    const thumbnails = await this.printerThumbnailCache.getAllValues();
    res.send(thumbnails);
  }

  @GET()
  @route("/:id")
  @before(permission(PERMS.PrinterFiles.Get))
  async getFiles(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    this.logger.log("Refreshing file storage (eager load)");
    const files = await this.printerFilesStore.loadFiles(currentPrinterId);
    res.send(files);
  }

  @POST()
  /**
   * @obsolete /:id/select, removed in v2
   */
  @route("/:id/select")
  @route("/:id/print")
  @before(permission(PERMS.PrinterFiles.Actions))
  async startPrintFile(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const { filePath } = await validateInput(req.body, startPrintFileSchema);
    const encodedFilePath = encodeURIComponent(filePath);
    await this.printerApi.startPrint(encodedFilePath);

    this.logger.log(`Started print for printer ${currentPrinterId}`);

    res.send();
  }

  @GET()
  @route("/:id/cache")
  @before(permission(PERMS.PrinterFiles.Get))
  async getFilesCache(req: Request, res: Response) {
    const { currentPrinter } = getScopedPrinter(req);
    res.send(this.printerFilesStore.getFiles(currentPrinter.id));
  }

  @GET()
  @route("/:id/download/:path")
  @before(permission(PERMS.PrinterFiles.Get))
  async downloadFile(req: Request, res: Response) {
    this.logger.log(`Downloading file ${ req.params.path }`);
    const { path } = await validateInput(req.params, downloadFileSchema);
    const encodedFilePath = encodeURIComponent(path);

    const response = await this.printerApi.downloadFile(encodedFilePath);
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Content-Length", response.headers["content-length"]);
    res.setHeader("Content-Disposition", response.headers["content-disposition"]);
    if (response.headers["etag"]?.length) {
      res.setHeader("ETag", response.headers["etag"]);
    }
    response.data.pipe(res);
  }

  @DELETE()
  @route("/:id")
  @before(permission(PERMS.PrinterFiles.Delete))
  async deleteFileOrFolder(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const { path } = await validateInput(req.query, getFileSchema);
    const encodedFilePath = encodeURIComponent(path);

    const result = await this.printerApi.deleteFile(encodedFilePath);
    await this.printerFilesStore.deleteFile(currentPrinterId, path);
    res.send(result);
  }

  @DELETE()
  @route("/:id/clear")
  @before(permission(PERMS.PrinterFiles.Clear))
  async clearPrinterFiles(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);

    const failedFiles = [];
    const succeededFiles = [];

    const nonRecursiveFiles = await this.printerApi.getFiles();
    for (let file of nonRecursiveFiles) {
      try {
        const encodedFilePath = encodeURIComponent(file.path);
        await this.printerApi.deleteFile(encodedFilePath);
        succeededFiles.push(file);
      } catch (e) {
        failedFiles.push(file);
      }
    }

    await this.printerFilesStore.purgePrinterFiles(currentPrinterId);

    res.send({
      failedFiles,
      succeededFiles,
    });
  }

  @GET()
  @route("/:id/thumbnail")
  @before(permission(PERMS.PrinterFiles.Get))
  async getPrinterThumbnail(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const printerThumbnail = await this.printerThumbnailCache.getValue(currentPrinterId);
    res.send(printerThumbnail);
  }

  @POST()
  @route("/:id/upload")
  @before(permission(PERMS.PrinterFiles.Upload))
  async uploadPrinterFile(req: Request, res: Response) {
    const { currentPrinterId, currentPrinter } = getScopedPrinter(req);

    const acceptedExtensions = this.getAcceptedFileExtensions(currentPrinter.printerType);
    const files = await this.multerService.multerLoadFileAsync(req, res, acceptedExtensions, true);

    // FormData has key-values with type string only
    const { startPrint: startPrintString } = await validateInput(req.body, uploadFileSchema);
    const startPrint = startPrintString === "true";

    if (!files?.length) {
      throw new ValidationException({
        error: `No file was available for upload. Did you upload files with one of these extensions: ${ acceptedExtensions.join(
          ", ",
        ) }?`,
      });
    }
    if (files.length > 1) {
      throw new ValidationException({
        error: "Only 1 file can be uploaded at a time",
      });
    }

    const uploadedFile = files[0];
    const token = this.multerService.startTrackingSession(uploadedFile, currentPrinterId);

    await this.printerApi.uploadFile({
      stream: createReadStream(uploadedFile.path),
      fileName: uploadedFile.originalname,
      contentLength: uploadedFile.size,
      startPrint,
      uploadToken: token,
    }).catch((e) => {
      try {
        this.multerService.clearUploadedFile(uploadedFile);
      } catch (e) {
        this.logger.error(`Could not remove uploaded file from temporary storage ${ errorSummary(e) }`);
      }
      throw e;
    });
    await this.printerFilesStore.loadFiles(currentPrinterId);

    // Process file: analyze, store, create job
    const ext = extname(uploadedFile.originalname);
    const tempPathWithExt = uploadedFile.path + ext;

    try {
      this.logger.log(`Processing uploaded file: ${ uploadedFile.originalname } (ext: ${ ext })`);

      // Copy file with proper extension for hash calculation and analysis
      if (!existsSync(uploadedFile.path)) {
        throw new NotFoundException(`Upload file does not exist: ${ uploadedFile.path }`);
      }

      copyFileSync(uploadedFile.path, tempPathWithExt);

      // Calculate hash for deduplication
      const fileHash = await this.fileStorageService.calculateFileHash(tempPathWithExt);
      this.logger.log(`File hash: ${ fileHash.substring(0, 12) }...`);

      // Check if file already analyzed (by hash)
      const existingJob = await this.fileStorageService.findDuplicateByHash(fileHash);

      let metadata;
      let fileStorageId;

      if (existingJob && existingJob.fileStorageId) {
        // Found duplicate by hash - REUSE existing storage file
        const cachedMetadata = await this.fileStorageService.loadMetadata(existingJob.fileStorageId);

        if (cachedMetadata) {
          // Use cached metadata from JSON file (fastest - no re-analysis, no re-storage)
          this.logger.log(`Duplicate file detected (job ${ existingJob.id }, hash match) - reusing storage ${ existingJob.fileStorageId }`);
          metadata = {
            ...cachedMetadata,
            fileName: uploadedFile.originalname, // Update filename to current upload
          };
          fileStorageId = existingJob.fileStorageId; // REUSE existing storage!
        } else if (existingJob.analysisState === "ANALYZED" && existingJob.metadata) {
          // No JSON cache, but have metadata in DB - use it and create JSON
          this.logger.log(`Duplicate file with DB metadata (job ${ existingJob.id }) - reusing storage ${ existingJob.fileStorageId }`);
          metadata = {
            ...existingJob.metadata,
            fileName: uploadedFile.originalname,
          };
          fileStorageId = existingJob.fileStorageId; // REUSE existing storage!

          // Save metadata JSON for future deduplication (preserve original filename)
          await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, uploadedFile.originalname);
        } else {
          // Duplicate hash but not analyzed - reuse storage, analyze file
          this.logger.log(`Duplicate file not analyzed - reusing storage ${ existingJob.fileStorageId }, analyzing now`);

          // Get existing file for analysis
          const existingFilePath = this.fileStorageService.getFilePath(existingJob.fileStorageId);
          const analysisResult = await this.fileAnalysisService.analyzeFile(existingFilePath);
          metadata = analysisResult.metadata;

          fileStorageId = existingJob.fileStorageId; // REUSE existing storage!
          await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, uploadedFile.originalname);
          this.logger.log(`Analysis complete and cached: ${ fileStorageId }`);
        }
      } else {
        // New file - analyze BEFORE saving (saveFile moves the original!)
        this.logger.log(`Analyzing new file: ${ uploadedFile.originalname }`);
        const analysisResult = await this.fileAnalysisService.analyzeFile(tempPathWithExt);
        metadata = analysisResult.metadata;
        const thumbnails = analysisResult.thumbnails;
        this.logger.log(`Analysis complete: format=${ metadata.fileFormat }, layers=${ metadata.totalLayers }, time=${ metadata.gcodePrintTimeSeconds }s, filament=${ metadata.filamentUsedGrams }g, thumbnails=${ thumbnails.length }`);

        // Now save file to storage with deterministic ID (moves file from temp to permanent storage)
        fileStorageId = await this.fileStorageService.saveFile(uploadedFile, fileHash);
        this.logger.log(`Saved file to storage: ${ fileStorageId } (deterministic from hash+name)`);

        // Save thumbnails
        let thumbnailMetadata: any[] = [];
        if (thumbnails.length > 0) {
          thumbnailMetadata = await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails);
          this.logger.log(`Saved ${ thumbnailMetadata.length } thumbnail(s) for ${ fileStorageId }`);
        }

        // Save metadata JSON with thumbnail index
        await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, uploadedFile.originalname, thumbnailMetadata);
        this.logger.log(`Saved metadata JSON for ${ fileStorageId }`);
      }

      // Create job with analyzed metadata, hash, and storageId
      const job = await this.printJobService.createPendingJob(
        currentPrinterId,
        uploadedFile.originalname,
        metadata,
        currentPrinter.name
      );

      // Update job with storage info
      job.fileStorageId = fileStorageId;
      job.fileHash = fileHash;
      await this.printJobService.printJobRepository.save(job);

      this.logger.log(
        `Created job ${ job.id }: format=${ job.fileFormat }, ` +
        `state=${ job.analysisState }, ` +
        `storageId=${ fileStorageId }, ` +
        `hash=${ fileHash.substring(0, 8) }...`
      );

      // Clean up temp analysis file
      if (existsSync(tempPathWithExt)) {
        unlinkSync(tempPathWithExt);
      }

      // Thumbnail will be automatically loaded from the analyzed print job
      // by the PrinterThumbnailCache when the job is analyzed
    } catch (error) {
      this.logger.error(`File processing failed: ${ errorSummary(error) }`);
      captureException(error);
      // Don't throw - allow upload to succeed even if analysis/storage fails
    } finally {
      // Always clean up temp file
      try {
        this.multerService.clearUploadedFile(uploadedFile);
      } catch (e) {
        this.logger.error(`Could not remove uploaded file from temporary storage ${ errorSummary(e) }`);
      }
    }

    res.send();
  }

  private getAcceptedFileExtensions(printerType: number): string[] {
    if (printerType === BambuType) {
      return AppConstants.defaultAcceptedBambuExtensions;
    }
    return AppConstants.defaultAcceptedGcodeExtensions;
  }
}
