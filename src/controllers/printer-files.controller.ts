import { before, DELETE, GET, POST, route } from "awilix-express";
import { authenticate, authorizePermission, authorizeRoles } from "@/middleware/authenticate";
import { getScopedPrinter, validateInput } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import { downloadFileRules, getFileRules, startPrintFileRules } from "./validation/printer-files-controller.validation";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { printerResolveMiddleware } from "@/middleware/printer";
import { PERMS, ROLES } from "@/constants/authorization.constants";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { SettingsStore } from "@/state/settings.store";
import { BatchCallService } from "@/services/core/batch-call.service";
import { MulterService } from "@/services/core/multer.service";
import { PrinterFileCleanTask } from "@/tasks/printer-file-clean.task";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Request, Response } from "express";
import { IPrinterApi } from "@/services/printer-api.interface";
import { extractThumbnailBase64 } from "@/utils/gcode.utils";
import { ensureDirExists, superRootPath } from "@/utils/fs.utils";
import { join } from "path";
import { existsSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { PrinterThumbnailCache } from "@/state/printer-thumbnail.cache";

@route(AppConstants.apiRoute + "/printer-files")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR]), printerResolveMiddleware()])
export class PrinterFilesController {
  printerApi: IPrinterApi;
  printerThumbnailCache: PrinterThumbnailCache;
  printerFilesStore: PrinterFilesStore;
  settingsStore: SettingsStore;
  batchCallService: BatchCallService;
  multerService: MulterService;
  printerFileCleanTask: PrinterFileCleanTask;
  logger: LoggerService;

  constructor({
    printerApi,
    printerFilesStore,
    batchCallService,
    printerFileCleanTask,
    settingsStore,
    loggerFactory,
    multerService,
    printerThumbnailCache,
  }: {
    printerApi: IPrinterApi;
    printerFilesStore: PrinterFilesStore;
    batchCallService: BatchCallService;
    printerFileCleanTask: PrinterFileCleanTask;
    settingsStore: SettingsStore;
    loggerFactory: ILoggerFactory;
    multerService: MulterService;
    printerThumbnailCache: PrinterThumbnailCache;
  }) {
    this.printerApi = printerApi;
    this.printerFilesStore = printerFilesStore;
    this.settingsStore = settingsStore;
    this.printerFileCleanTask = printerFileCleanTask;
    this.batchCallService = batchCallService;
    this.multerService = multerService;
    this.printerThumbnailCache = printerThumbnailCache;
    this.logger = loggerFactory(PrinterFilesController.name);
  }

  @GET()
  @route("/tracked-uploads")
  @before(authorizePermission(PERMS.PrinterFiles.Upload))
  getTrackedUploads(req: Request, res: Response) {
    const sessions = this.multerService.getSessions();
    res.send(sessions);
  }

  @POST()
  @route("/purge")
  @before(authorizePermission(PERMS.PrinterFiles.Clear))
  async purgeIndexedFiles(req: Request, res: Response) {
    await this.printerFilesStore.purgeFiles();
    res.send();
  }

  @GET()
  @route("/thumbnails")
  @before(authorizePermission(PERMS.PrinterFiles.Get))
  async getThumbnails(req: Request, res: Response) {
    const thumbnails = await this.printerThumbnailCache.getAllValues();
    res.send(thumbnails);
  }

  @GET()
  @route("/:id")
  @before(authorizePermission(PERMS.PrinterFiles.Get))
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
  @before(authorizePermission(PERMS.PrinterFiles.Actions))
  async startPrintFile(req: Request, res: Response) {
    const { filePath } = await validateInput(req.body, startPrintFileRules);
    await this.printerApi.startPrint(filePath);
    res.send();
  }

  @GET()
  @route("/:id/cache")
  @before(authorizePermission(PERMS.PrinterFiles.Get))
  async getFilesCache(req: Request, res: Response) {
    const { currentPrinter } = getScopedPrinter(req);
    res.send(this.printerFilesStore.getFiles(currentPrinter.id));
  }

  @GET()
  @route("/:id/download/:path")
  @before(authorizePermission(PERMS.PrinterFiles.Get))
  async downloadFile(req: Request, res: Response) {
    this.logger.log(`Downloading file ${req.params.path}`);
    const { path } = await validateInput(req.params, downloadFileRules);
    const response = await this.printerApi.downloadFile(path);
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
  @before(authorizePermission(PERMS.PrinterFiles.Delete))
  async deleteFileOrFolder(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const { path } = await validateInput(req.query, getFileRules);
    const result = await this.printerApi.deleteFile(path);
    await this.printerFilesStore.deleteFile(currentPrinterId, path);
    res.send(result);
  }

  @DELETE()
  @route("/:id/clear")
  @before(authorizePermission(PERMS.PrinterFiles.Clear))
  async clearPrinterFiles(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);

    const failedFiles = [];
    const succeededFiles = [];

    const nonRecursiveFiles = await this.printerApi.getFiles();
    for (let file of nonRecursiveFiles) {
      try {
        await this.printerApi.deleteFile(file.path);
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

  @POST()
  @route("/upload")
  @before(authorizePermission(PERMS.PrinterFiles.Upload))
  async uploadFile(req: Request, res: Response) {
    const files = await this.multerService.multerLoadFileAsync(req, res, AppConstants.defaultAcceptedGcodeExtensions, true);
    if (!files?.length) {
      throw new ValidationException({
        error: `No file was available for upload. Did you upload files with one of these extensions: ${AppConstants.defaultAcceptedGcodeExtensions.join(
          ", "
        )}?`,
      });
    }
    if (files.length > 1) {
      throw new ValidationException({
        error: "Only 1 .gcode file can be uploaded at a time",
      });
    }

    const file = files[0];
    if (!file.filename?.length) {
      throw new Error("File name is required");
    }

    // Move it to uploads, add it to original

    const uploadsFolder = join(superRootPath(), AppConstants.defaultFileUploadsStorage);
    ensureDirExists(uploadsFolder);

    const metadataFile = join(uploadsFolder, file.filename.trim() + ".metadata.json");

    // Write the file itself
    const targetFilename = join(uploadsFolder, file.filename);
    renameSync(file.path, targetFilename);

    // Add the thumbnail if present
    const metadata = {
      originalname: file.originalname,
      uploaded: Date.now(),
      mimetype: file.mimetype,
      filename: file.filename,
      thumbnailFound: false,
    };
    const thumbnailName = join(uploadsFolder, file.filename.trim() + ".dat");

    try {
      await extractThumbnailBase64(targetFilename, thumbnailName);
      metadata.thumbnailFound = true;
    } catch (e) {
      this.logger.error("Could not parse thumbnail, clearing printer thumbnail", e);
      if (existsSync(thumbnailName)) {
        rmSync(thumbnailName);
      }
    }

    // Write the metadata file
    writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    res.send();
  }

  @GET()
  @route("/:id/thumbnail")
  @before(authorizePermission(PERMS.PrinterFiles.Get))
  async getPrinterThumbnail(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const printerThumbnail = await this.printerThumbnailCache.getValue(currentPrinterId.toString());
    res.send(printerThumbnail);
  }

  @POST()
  @route("/:id/upload")
  @before(authorizePermission(PERMS.PrinterFiles.Upload))
  async uploadPrinterFile(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);

    const files = await this.multerService.multerLoadFileAsync(req, res, AppConstants.defaultAcceptedGcodeExtensions, true);
    if (!files?.length) {
      throw new ValidationException({
        error: `No file was available for upload. Did you upload files with one of these extensions: ${AppConstants.defaultAcceptedGcodeExtensions.join(
          ", "
        )}?`,
      });
    }
    if (files.length > 1) {
      throw new ValidationException({
        error: "Only 1 .gcode file can be uploaded at a time",
      });
    }

    const baseFolder = join(superRootPath(), AppConstants.defaultPrinterThumbnailsStorage);
    const thumbnailName = join(baseFolder, currentPrinterId + ".dat");
    try {
      ensureDirExists(baseFolder);
      const data = await extractThumbnailBase64(files[0].path, thumbnailName);
      await this.printerThumbnailCache.setPrinterThumbnail(currentPrinterId.toString(), data);
    } catch (e) {
      this.logger.error("Could not parse thumbnail, clearing printer thumbnail", e);
      if (existsSync(thumbnailName)) {
        rmSync(thumbnailName);
      }
    }

    // Perform specific file clean if configured
    const fileCleanEnabled = this.settingsStore.isPreUploadFileCleanEnabled();
    if (fileCleanEnabled) {
      await this.printerFileCleanTask.cleanPrinterFiles(currentPrinterId);
    }

    const uploadedFile = files[0];
    const token = this.multerService.startTrackingSession(uploadedFile);
    await this.printerApi.uploadFile(uploadedFile, token);
    await this.printerFilesStore.loadFiles(currentPrinterId);

    res.send();
  }
}
