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
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { printerResolveMiddleware } from "@/middleware/printer";
import { PERMS, ROLES } from "@/constants/authorization.constants";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { SettingsStore } from "@/state/settings.store";
import { MulterService } from "@/services/core/multer.service";
import { PrinterFileCleanTask } from "@/tasks/printer-file-clean.task";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Request, Response } from "express";
import { BambuType, IPrinterApi} from "@/services/printer-api.interface";
import { PrinterThumbnailCache } from "@/state/printer-thumbnail.cache";
import { captureException } from "@sentry/node";
import { errorSummary } from "@/utils/error.utils";
import { LoginDto } from "@/services/interfaces/login.dto";
import { getScopedPrinter } from "@/middleware/printer-resolver";

@route(AppConstants.apiRoute + "/printer-files")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR]), printerResolveMiddleware()])
export class PrinterFilesController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerApi: IPrinterApi,
    private readonly printerLogin: LoginDto,
    private readonly printerFilesStore: PrinterFilesStore,
    private readonly printerFileCleanTask: PrinterFileCleanTask,
    private readonly settingsStore: SettingsStore,
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
  @route("/:id/reload-thumbnail")
  @before(permission(PERMS.PrinterFiles.Actions))
  async reloadThumbnail(req: Request, res: Response) {
    const { filePath } = await validateInput(req.body, startPrintFileSchema);

    try {
      if (this.settingsStore.isThumbnailSupportEnabled()) {
        await this.printerThumbnailCache.loadPrinterThumbnailRemote(this.printerLogin, req.params.id, filePath);
      }
    } catch (e) {
      this.logger.error(`Unexpected error processing thumbnail ${errorSummary(e)}`);
      captureException(e);
    }

    res.send();
  }

  @POST()
  /**
   * @obsolete /:id/select, removed in v2
   */
  @route("/:id/select")
  @route("/:id/print")
  @before(permission(PERMS.PrinterFiles.Actions))
  async startPrintFile(req: Request, res: Response) {
    const { filePath } = await validateInput(req.body, startPrintFileSchema);
    const encodedFilePath = encodeURIComponent(filePath);
    await this.printerApi.startPrint(encodedFilePath);

    try {
      if (this.settingsStore.isThumbnailSupportEnabled()) {
        await this.printerThumbnailCache.loadPrinterThumbnailRemote(this.printerLogin, req.params.id, encodedFilePath);
      }
    } catch (e) {
      this.logger.error(`Unexpected error processing thumbnail ${errorSummary(e)}`);
      captureException(e);
    }

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
    this.logger.log(`Downloading file ${req.params.path}`);
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
    const printerThumbnail = await this.printerThumbnailCache.getValue(currentPrinterId.toString());
    res.send(printerThumbnail);
  }

  @POST()
  @route("/:id/upload")
  @before(permission(PERMS.PrinterFiles.Upload))
  async uploadPrinterFile(req: Request, res: Response) {
    const { currentPrinterId, currentPrinter } = getScopedPrinter(req);

    // Get accepted file extensions based on printer type
    const acceptedExtensions = this.getAcceptedFileExtensions(currentPrinter.printerType);

    const files = await this.multerService.multerLoadFileAsync(
      req,
      res,
      acceptedExtensions,
      true,
    );

    // Multer has loaded the formdata
    const { startPrint: startPrintString } = await validateInput(req.body, uploadFileSchema);
    const startPrint = startPrintString === "true";

    if (!files?.length) {
      throw new ValidationException({
        error: `No file was available for upload. Did you upload files with one of these extensions: ${acceptedExtensions.join(
          ", ",
        )}?`,
      });
    }
    if (files.length > 1) {
      throw new ValidationException({
        error: "Only 1 file can be uploaded at a time",
      });
    }

    // Perform specific file clean if configured
    const fileCleanEnabled = this.settingsStore.isPreUploadFileCleanEnabled();
    if (fileCleanEnabled) {
      await this.printerFileCleanTask.cleanPrinterFiles(currentPrinterId);
    }

    const uploadedFile = files[0];
    const token = this.multerService.startTrackingSession(uploadedFile, currentPrinterId);

    await this.printerApi.uploadFile(uploadedFile, startPrint, token).catch((e) => {
      try {
        this.multerService.clearUploadedFile(uploadedFile);
      } catch (e) {
        this.logger.error(`Could not remove uploaded file from temporary storage ${errorSummary(e)}`);
      }
      throw e;
    });
    await this.printerFilesStore.loadFiles(currentPrinterId);

    try {
      if (this.settingsStore.isThumbnailSupportEnabled()) {
        await this.printerThumbnailCache.loadPrinterThumbnailLocal(currentPrinterId, files[0].path);
      }
    } catch (e) {
      this.logger.error(`Unexpected error processing thumbnail ${errorSummary(e)}`);
      captureException(e);
    }

    try {
      this.multerService.clearUploadedFile(uploadedFile);
    } catch (e) {
      this.logger.error(`Could not remove uploaded file from temporary storage ${errorSummary(e)}`);
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
