import { before, DELETE, GET, POST, route } from "awilix-express";
import { authenticate, authorizeRoles, permission } from "@/middleware/authenticate";
import { validateInput } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import {
  downloadFileSchema,
  getFileSchema,
  getFilesSchema,
  startPrintFileSchema,
  uploadFileSchema,
} from "./validation/printer-files-controller.validation";
import { NotFoundException, ValidationException } from "@/exceptions/runtime.exceptions";
import { printerResolveMiddleware } from "@/middleware/printer";
import { PERMS, ROLES } from "@/constants/authorization.constants";
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
    private readonly printJobService: PrintJobService,
    private readonly fileAnalysisService: FileAnalysisService,
    private readonly fileStorageService: FileStorageService,
    private readonly multerService: MulterService,
    private readonly printerThumbnailCache: PrinterThumbnailCache,
  ) {
    this.logger = loggerFactory(PrinterFilesController.name);
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
    const { printerApi } = getScopedPrinter(req);
    const { recursive: recursiveStr, startDir } = await validateInput(req.query, getFilesSchema);
    const recursive = recursiveStr === "true";

    const files = await printerApi.getFiles(recursive, startDir);
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
    const encodedFilePath = filePath.split('/').map(encodeURIComponent).join('/');
    await this.printerApi.startPrint(encodedFilePath);

    this.logger.log(`Started print for printer ${ currentPrinterId }`);

    res.send();
  }

  @GET()
  @route("/:id/download/:path")
  @before(permission(PERMS.PrinterFiles.Get))
  async downloadFile(req: Request, res: Response) {
    this.logger.log(`Downloading file ${ req.params.path }`);
    const { path } = await validateInput(req.params, downloadFileSchema);
    const encodedFilePath = path.split('/').map(encodeURIComponent).join('/');

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
    const { path } = await validateInput(req.query, getFileSchema);
    const encodedFilePath = path.split('/').map(encodeURIComponent).join('/');

    const result = await this.printerApi.deleteFile(encodedFilePath);
    res.send(result);
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

    const { startPrint: startPrintString } = await validateInput(req.body, uploadFileSchema);
    const startPrint = startPrintString === "true";

    if (!files?.length) {
      throw new ValidationException({
        error: `No file was available for upload. Did you upload files with one of these extensions: ${ acceptedExtensions.join(", ") }?`,
      });
    }
    if (files.length > 1) {
      throw new ValidationException({
        error: "Only 1 file can be uploaded at a time",
      });
    }

    const uploadedFile = files[0];
    const token = this.multerService.startTrackingSession(uploadedFile, currentPrinterId);

    try {
      await this.printerApi.uploadFile({
        stream: createReadStream(uploadedFile.path),
        fileName: uploadedFile.originalname,
        contentLength: uploadedFile.size,
        startPrint,
        uploadToken: token,
      });

      await this.processUploadedFile(uploadedFile, currentPrinterId, currentPrinter.name);
    } catch (error) {
      this.cleanupTempFile(uploadedFile);
      throw error;
    }

    this.cleanupTempFile(uploadedFile);
    res.send();
  }

  private async processUploadedFile(uploadedFile: Express.Multer.File, printerId: number, printerName: string) {
    const ext = extname(uploadedFile.originalname);
    const tempPathWithExt = uploadedFile.path + ext;

    try {
      this.logger.log(`Processing uploaded file: ${ uploadedFile.originalname }`);

      if (!existsSync(uploadedFile.path)) {
        throw new NotFoundException(`Upload file does not exist: ${ uploadedFile.path }`);
      }

      copyFileSync(uploadedFile.path, tempPathWithExt);

      const fileHash = await this.fileStorageService.calculateFileHash(tempPathWithExt);
      this.logger.log(`File hash: ${ fileHash.substring(0, 12) }...`);

      const existingJob = await this.fileStorageService.findDuplicateByHash(fileHash);

      const { metadata, fileStorageId } = existingJob?.fileStorageId
        ? await this.handleDuplicateFile(existingJob, uploadedFile, fileHash, tempPathWithExt)
        : await this.handleNewFile(uploadedFile, fileHash, tempPathWithExt);

      await this.createPrintJob(printerId, printerName, uploadedFile.originalname, metadata, fileStorageId, fileHash);

      if (existsSync(tempPathWithExt)) {
        unlinkSync(tempPathWithExt);
      }
    } catch (error) {
      this.logger.error(`File processing failed: ${ errorSummary(error) }`);
      captureException(error);
    }
  }

  private async handleDuplicateFile(
    existingJob: PrintJob,
    uploadedFile: Express.Multer.File,
    fileHash: string,
    tempPathWithExt: string
  ): Promise<{ metadata: any; fileStorageId: string }> {
    const fileStorageId = existingJob.fileStorageId!;

    const cachedMetadata = await this.fileStorageService.loadMetadata(fileStorageId);
    if (cachedMetadata) {
      this.logger.log(`Reusing cached metadata for storage ${ fileStorageId }`);
      return {
        metadata: { ...cachedMetadata, fileName: uploadedFile.originalname },
        fileStorageId,
      };
    }

    if (existingJob.analysisState === "ANALYZED" && existingJob.metadata) {
      this.logger.log(`Reusing DB metadata for storage ${ fileStorageId }`);
      const metadata = { ...existingJob.metadata, fileName: uploadedFile.originalname };
      await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, uploadedFile.originalname);
      return { metadata, fileStorageId };
    }

    this.logger.log(`Analyzing duplicate file for storage ${ fileStorageId }`);
    const existingFilePath = this.fileStorageService.getFilePath(fileStorageId);
    const analysisResult = await this.fileAnalysisService.analyzeFile(existingFilePath);
    await this.fileStorageService.saveMetadata(fileStorageId, analysisResult.metadata, fileHash, uploadedFile.originalname);

    return { metadata: analysisResult.metadata, fileStorageId };
  }

  private async handleNewFile(
    uploadedFile: Express.Multer.File,
    fileHash: string,
    tempPathWithExt: string
  ): Promise<{ metadata: any; fileStorageId: string }> {
    this.logger.log(`Analyzing new file: ${ uploadedFile.originalname }`);

    const analysisResult = await this.fileAnalysisService.analyzeFile(tempPathWithExt);
    const { metadata, thumbnails } = analysisResult;

    this.logger.log(`Analysis complete: format=${ metadata.fileFormat }, layers=${ metadata.totalLayers }`);

    const fileStorageId = await this.fileStorageService.saveFile(uploadedFile, fileHash);
    this.logger.log(`Saved file to storage: ${ fileStorageId }`);

    const thumbnailMetadata = thumbnails.length > 0
      ? await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails)
      : [];

    if (thumbnailMetadata.length > 0) {
      this.logger.log(`Saved ${ thumbnailMetadata.length } thumbnail(s)`);
    }

    await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, uploadedFile.originalname, thumbnailMetadata);

    return { metadata, fileStorageId };
  }

  private async createPrintJob(
    printerId: number,
    printerName: string,
    fileName: string,
    metadata: any,
    fileStorageId: string,
    fileHash: string
  ) {
    const job = await this.printJobService.createPendingJob(printerId, fileName, metadata, printerName);
    job.fileStorageId = fileStorageId;
    job.fileHash = fileHash;
    await this.printJobService.updateJob(job);

    this.logger.log(`Created job ${ job.id }: storageId=${ fileStorageId }, hash=${ fileHash.substring(0, 8) }...`);
  }

  private cleanupTempFile(file: Express.Multer.File) {
    try {
      this.multerService.clearUploadedFile(file);
    } catch (e) {
      this.logger.error(`Could not remove uploaded file from temporary storage: ${ errorSummary(e) }`);
    }
  }

  private getAcceptedFileExtensions(printerType: number): string[] {
    if (printerType === BambuType) {
      return AppConstants.defaultAcceptedBambuExtensions;
    }
    return AppConstants.defaultAcceptedGcodeExtensions;
  }
}
