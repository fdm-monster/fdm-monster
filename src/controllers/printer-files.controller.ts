import { createController } from "awilix-express";
import { authenticate, authorizeRoles, withPermission } from "@/middleware/authenticate";
import { getScopedPrinter, validateInput, validateMiddleware } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import {
  createFolderRules,
  fileUploadCommandsRules,
  getFileRules,
  getFilesRules,
  moveFileOrFolderRules,
  selectAndPrintFileRules,
  uploadFileRules,
} from "./validation/printer-files-controller.validation";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { printerResolveMiddleware } from "@/middleware/printer";
import { PERMS, ROLES } from "@/constants/authorization.constants";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { SettingsStore } from "@/state/settings.store";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { BatchCallService } from "@/services/core/batch-call.service";
import { MulterService } from "@/services/core/multer.service";
import { PrinterFileCleanTask } from "@/tasks/printer-file-clean.task";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Request, Response } from "express";

export class PrinterFilesController {
  printerFilesStore: PrinterFilesStore;
  settingsStore: SettingsStore;
  octoprintClient: OctoprintClient;
  batchCallService: BatchCallService;
  multerService: MulterService;
  printerFileCleanTask: PrinterFileCleanTask;
  logger: LoggerService;

  constructor({
    printerFilesStore,
    octoprintClient,
    batchCallService,
    printerFileCleanTask,
    settingsStore,
    loggerFactory,
    multerService,
  }: {
    printerFilesStore: PrinterFilesStore;
    octoprintClient: OctoprintClient;
    batchCallService: BatchCallService;
    printerFileCleanTask: PrinterFileCleanTask;
    settingsStore: SettingsStore;
    loggerFactory: ILoggerFactory;
    multerService: MulterService;
  }) {
    this.printerFilesStore = printerFilesStore;
    this.settingsStore = settingsStore;
    this.printerFileCleanTask = printerFileCleanTask;
    this.octoprintClient = octoprintClient;
    this.batchCallService = batchCallService;
    this.multerService = multerService;
    this.logger = loggerFactory(PrinterFilesController.name);
  }

  getTrackedUploads(req: Request, res: Response) {
    const sessions = this.multerService.getSessions();
    res.send(sessions);
  }

  async getFiles(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const { recursive } = await validateInput(req.query, getFilesRules);

    this.logger.log("Refreshing file storage (eager load)");
    const files = await this.printerFilesStore.loadFiles(currentPrinterId, recursive as boolean);
    res.send(files);
  }

  /**
   * When the printer host is not reachable or is disabled the cache is still accessible
   */
  async getFilesCache(req: Request, res: Response) {
    const { currentPrinter } = getScopedPrinter(req);

    res.send(this.printerFilesStore.getFiles(currentPrinter.id));
  }

  async clearPrinterFiles(req: Request, res: Response) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);

    const nonRecursiveFiles = await this.octoprintClient.getLocalFiles(printerLogin, false);

    const failedFiles = [];
    const succeededFiles = [];

    for (let file of nonRecursiveFiles) {
      try {
        await this.octoprintClient.deleteFileOrFolder(printerLogin, file.path);
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

  async purgeIndexedFiles(req: Request, res: Response) {
    await this.printerFilesStore.purgeFiles();

    res.send();
  }

  async moveFileOrFolder(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const { filePath: path, destination } = await validateMiddleware(req, moveFileOrFolderRules);

    const result = await this.octoprintClient.moveFileOrFolder(printerLogin, path, destination);

    // TODO Update file storage

    res.send(result);
  }

  async createFolder(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const { path, foldername } = await validateMiddleware(req, createFolderRules);

    const result = await this.octoprintClient.createFolder(printerLogin, path, foldername);

    // TODO Update file storage

    res.send(result);
  }

  async deleteFileOrFolder(req: Request, res: Response) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);
    const { path } = await validateInput(req.query, getFileRules);

    const result = await this.octoprintClient.deleteFileOrFolder(printerLogin, path);
    await this.printerFilesStore.deleteFile(currentPrinterId, path, false);
    res.send(result);
  }

  async selectAndPrintFile(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const { filePath: path, print } = await validateInput(req.body, selectAndPrintFileRules);

    const result = await this.octoprintClient.selectPrintFile(printerLogin, path, print);
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

    const token = this.multerService.startTrackingSession(uploadedFile);
    const response = await this.octoprintClient.uploadFileAsMultiPart(
      printerLogin,
      uploadedFile,
      {
        print,
        select,
      },
      token
    );

    await this.printerFilesStore.loadFiles(currentPrinterId, false);

    res.send(response);
  }
}

// prettier-ignore
export default createController(PrinterFilesController)
  .prefix(AppConstants.apiRoute + "/printer-files")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR]), printerResolveMiddleware()])
  .post("/purge", "purgeIndexedFiles", withPermission(PERMS.PrinterFiles.Clear))
  .get("/tracked-uploads", "getTrackedUploads", withPermission(PERMS.PrinterFiles.Upload))
  .get("/:id", "getFiles", withPermission(PERMS.PrinterFiles.Get))
  .get("/:id/cache", "getFilesCache", withPermission(PERMS.PrinterFiles.Get))
  .post("/:id/upload", "uploadFile", withPermission(PERMS.PrinterFiles.Upload))
  .post("/:id/create-folder", "createFolder", withPermission(PERMS.PrinterFiles.Actions))
  .post("/:id/select", "selectAndPrintFile", withPermission(PERMS.PrinterFiles.Actions))
  .post("/:id/move", "moveFileOrFolder", withPermission(PERMS.PrinterFiles.Actions))
  .delete("/:id", "deleteFileOrFolder", withPermission(PERMS.PrinterFiles.Delete))
  .delete("/:id/clear", "clearPrinterFiles", withPermission(PERMS.PrinterFiles.Clear));
