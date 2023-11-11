import fs from "fs";
import { createController } from "awilix-express";
import { authenticate, authorizeRoles, withPermission } from "@/middleware/authenticate";
import { getScopedPrinter, validateInput, validateMiddleware } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import {
  createFolderRules,
  fileUploadCommandsRules,
  getFileRules,
  getFilesRules,
  localFileUploadRules,
  moveFileOrFolderRules,
  selectAndPrintFileRules,
  uploadFileRules,
} from "./validation/printer-files-controller.validation";
import { batchPrinterRules } from "@/controllers/validation/batch-controller.validation";
import { NotFoundException, ValidationException } from "@/exceptions/runtime.exceptions";
import { printerResolveMiddleware } from "@/middleware/printer";
import { PERMS, ROLES } from "@/constants/authorization.constants";
import { FilesStore } from "@/state/files.store";
import { SettingsStore } from "@/state/settings.store";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { BatchCallService } from "@/services/batch-call.service";
import { MulterService } from "@/services/core/multer.service";
import { PrinterFileCleanTask } from "@/tasks/printer-file-clean.task";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Request, Response } from "express";
import { AxiosResponse } from "axios";

export class PrinterFilesController {
  filesStore: FilesStore;
  settingsStore: SettingsStore;
  octoPrintApiService: OctoPrintApiService;
  batchCallService: BatchCallService;
  multerService: MulterService;
  printerFileCleanTask: PrinterFileCleanTask;
  logger: LoggerService;
  isTypeormMode: boolean;

  constructor({
    filesStore,
    octoPrintApiService,
    batchCallService,
    printerFileCleanTask,
    settingsStore,
    loggerFactory,
    multerService,
    isTypeormMode,
  }: {
    filesStore: FilesStore;
    octoPrintApiService: OctoPrintApiService;
    batchCallService: BatchCallService;
    printerFileCleanTask: PrinterFileCleanTask;
    settingsStore: SettingsStore;
    loggerFactory: ILoggerFactory;
    multerService: MulterService;
    isTypeormMode: boolean;
  }) {
    this.filesStore = filesStore;
    this.settingsStore = settingsStore;
    this.printerFileCleanTask = printerFileCleanTask;
    this.octoPrintApiService = octoPrintApiService;
    this.batchCallService = batchCallService;
    this.multerService = multerService;
    this.isTypeormMode = isTypeormMode;
    this.logger = loggerFactory(PrinterFilesController.name);
  }

  getTrackedUploads(req: Request, res: Response) {
    const sessions = this.multerService.getSessions();
    res.send(sessions);
  }

  async getFiles(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const { recursive } = await validateInput(req.query, getFilesRules);

    this.logger.log("Refreshing file storage by eager load");
    const response = await this.filesStore.eagerLoadPrinterFiles(currentPrinterId, recursive);
    this.statusResponse(res, response);
  }

  /**
   * When the printer host is not reachable or is disabled the cache is still accessible
   */
  async getFilesCache(req: Request, res: Response) {
    const { currentPrinter } = getScopedPrinter(req);

    const filesCache = await this.filesStore.getFiles(currentPrinter.id);
    res.send(filesCache);
  }

  async clearPrinterFiles(req: Request, res: Response) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);

    const nonRecursiveFiles = await this.octoPrintApiService.getFiles(printerLogin, false);

    const failedFiles = [];
    const succeededFiles = [];

    for (let file of nonRecursiveFiles.files) {
      try {
        await this.octoPrintApiService.deleteFileOrFolder(printerLogin, file.path);
        succeededFiles.push(file);
      } catch (e) {
        failedFiles.push(file);
      }
    }

    await this.filesStore.purgePrinterFiles(currentPrinterId);

    res.send({
      failedFiles,
      succeededFiles,
    });
  }

  async purgeIndexedFiles(req: Request, res: Response) {
    await this.filesStore.purgeFiles();

    res.send();
  }

  async moveFileOrFolder(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const { filePath: path, destination } = await validateMiddleware(req, moveFileOrFolderRules);

    const result = await this.octoPrintApiService.moveFileOrFolder(printerLogin, path, destination);

    // TODO Update file storage

    res.send(result);
  }

  async createFolder(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const { path, foldername } = await validateMiddleware(req, createFolderRules);

    const result = await this.octoPrintApiService.createFolder(printerLogin, path, foldername);

    // TODO Update file storage

    res.send(result);
  }

  async deleteFileOrFolder(req: Request, res: Response) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);
    const { path } = await validateInput(req.query, getFileRules);

    const result = await this.octoPrintApiService.deleteFileOrFolder(printerLogin, path);

    await this.filesStore.deleteFile(currentPrinterId, path, false);
    this.logger.log(`File reference removed, printerId ${currentPrinterId}`, path);

    res.send(result);
  }

  /**
   * @deprecated this API endpoint will be moved to /batch from BatchCallController in 1.6.0
   */
  async batchReprintFiles(req: Request, res: Response) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules(this.isTypeormMode));
    const results = await this.batchCallService.batchReprintCalls(printerIds);
    res.send(results);
  }

  async selectAndPrintFile(req: Request, res: Response) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);
    const { filePath: path, print } = await validateInput(req.body, selectAndPrintFileRules);

    const result = await this.octoPrintApiService.selectPrintFile(printerLogin, path, print);

    await this.filesStore.setExistingFileForPrint(currentPrinterId, path);
    res.send(result);
  }

  async uploadFile(req: Request, res: Response) {
    const { printerLogin, currentPrinterId } = getScopedPrinter(req);
    const {} = await validateInput(req.query, uploadFileRules);

    const files = await this.multerService.multerLoadFileAsync(req, res, ".gcode", true);

    if (!files?.length) {
      throw new ValidationException({
        error: "No file was available for upload. Did you upload files with extension '.gcode'?",
      });
    }
    if (files.length > 1) {
      throw new ValidationException({
        error: "Only 1 .gcode file can be uploaded at a time due to bandwidth restrictions",
      });
    }

    // Multer has processed the remaining multipart data into the body as json
    const { print, select } = await validateInput(req.body, fileUploadCommandsRules);
    const uploadedFile = files[0];

    // Perform specific file clean if configured
    const fileCleanEnabled = this.settingsStore.isPreUploadFileCleanEnabled();
    if (fileCleanEnabled) {
      await this.printerFileCleanTask.cleanPrinterFiles(currentPrinterId);
    }

    const token = this.multerService.startTrackingSession(files);
    const response = await this.octoPrintApiService.uploadFileAsMultiPart(
      printerLogin,
      uploadedFile,
      {
        print,
        select,
      },
      token
    );

    if (response.success !== false) {
      const newOrUpdatedFile = response.files.local;
      await this.filesStore.appendOrSetPrinterFile(currentPrinterId, newOrUpdatedFile);
    }

    res.send(response);
  }

  /**
   * This endpoint is not actively used. Its better to introduce a virtual file system (VFS) to be able to manage centralized uploads.
   */
  async localUploadFile(req: Request, res: Response) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);
    const { select, print, localLocation } = await validateInput(req.body, localFileUploadRules);

    if (!localLocation.endsWith(".gcode")) {
      throw new ValidationException({
        localLocation: "The indicated file extension did not match '.gcode'",
      });
    }

    if (!fs.existsSync(localLocation)) {
      throw new NotFoundException("The indicated file was not found.");
    }

    if (fs.lstatSync(localLocation).isDirectory()) {
      throw new ValidationException({
        localLocation: "The indicated file was not correctly found.",
      });
    }

    const stream = fs.createReadStream(localLocation);
    const response = await this.octoPrintApiService.uploadFileAsMultiPart(printerLogin, stream, {
      select,
      print,
    });

    // TODO update file cache with files store
    if (response.success !== false) {
      const newOrUpdatedFile = response.files.local;
      await this.filesStore.appendOrSetPrinterFile(currentPrinterId, newOrUpdatedFile);
    }

    res.send(response);
  }

  private statusResponse(res: Response, response: AxiosResponse) {
    res.statusCode = response.status;
    res.send(response.data);
  }
}

// prettier-ignore
export default createController(PrinterFilesController)
  .prefix(AppConstants.apiRoute + "/printer-files")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR]), printerResolveMiddleware()])
  .post("/purge", "purgeIndexedFiles", withPermission(PERMS.PrinterFiles.Clear))
  .get("/tracked-uploads", "getTrackedUploads", withPermission(PERMS.PrinterFiles.Upload))
  /**
   * @deprecated will be moved to /batch in 1.6.0
   */
  .post("/batch/reprint-files", "batchReprintFiles", withPermission(PERMS.PrinterFiles.Actions))
  .get("/:id", "getFiles", withPermission(PERMS.PrinterFiles.Get))
  .get("/:id/cache", "getFilesCache", withPermission(PERMS.PrinterFiles.Get))
  .post("/:id/local-upload", "localUploadFile", withPermission(PERMS.PrinterFiles.Upload))
  .post("/:id/upload", "uploadFile", withPermission(PERMS.PrinterFiles.Upload))
  .post("/:id/create-folder", "createFolder", withPermission(PERMS.PrinterFiles.Actions))
  .post("/:id/select", "selectAndPrintFile", withPermission(PERMS.PrinterFiles.Actions))
  .post("/:id/move", "moveFileOrFolder", withPermission(PERMS.PrinterFiles.Actions))
  .delete("/:id", "deleteFileOrFolder", withPermission(PERMS.PrinterFiles.Delete))
  .delete("/:id/clear", "clearPrinterFiles", withPermission(PERMS.PrinterFiles.Clear));
