const fs = require("fs");
const { authenticate, withPermission } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { validateInput, getScopedPrinter, validateMiddleware } = require("../handlers/validators");
const { AppConstants } = require("../server.constants");
const {
  getFilesRules,
  getFileRules,
  uploadFileRules,
  fileUploadCommandsRules,
  selectAndPrintFileRules,
  localFileUploadRules,
  moveFileOrFolderRules,
  createFolderRules,
  batchPrinterRules,
} = require("./validation/printer-files-controller.validation");
const { ValidationException, NotFoundException } = require("../exceptions/runtime.exceptions");
const { printerResolveMiddleware } = require("../middleware/printer");
const { ROLES, PERMS } = require("../constants/authorization.constants");
const { authorizeRoles } = require("../middleware/authenticate");

export class PrinterFilesController {
  /**
   * @type {FilesStore}
   */
  filesStore;
  /**
   * @type {SettingsStore}
   */
  settingsStore;
  /**
   * @type {OctoPrintApiService}
   */
  octoPrintApiService;
  /**
   * @type {BatchCallService}
   */
  batchCallService;
  /**
   * @type {MulterService}
   */
  multerService;
  /**
   * @type {PrinterFileCleanTask}
   */
  printerFileCleanTask;

  /**
   * @type {LoggerService}
   */
  logger;

  constructor({
    filesStore,
    octoPrintApiService,
    batchCallService,
    printerSocketStore,
    printerFileCleanTask,
    settingsStore,
    loggerFactory,
    multerService,
  }) {
    this.filesStore = filesStore;
    this.settingsStore = settingsStore;
    this.printerFileCleanTask = printerFileCleanTask;
    this.octoPrintApiService = octoPrintApiService;
    this.batchCallService = batchCallService;
    this.printerSocketStore = printerSocketStore;
    this.multerService = multerService;
    this.logger = loggerFactory("Server-API");
  }

  #statusResponse(res, response) {
    res.statusCode = response.status;
    res.send(response.data);
  }

  getTrackedUploads(req, res) {
    const sessions = this.multerService.getSessions();
    res.send(sessions);
  }

  async getFiles(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const { recursive } = await validateInput(req.query, getFilesRules);

    this.logger.log("Refreshing file storage by eager load");
    const response = await this.filesStore.eagerLoadPrinterFiles(currentPrinterId, recursive);
    this.#statusResponse(res, response);
  }

  /**
   * When the printer host is not reachable or is disabled the cache is still accessible
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async getFilesCache(req, res) {
    const { currentPrinter } = getScopedPrinter(req);

    const filesCache = await this.filesStore.getFiles(currentPrinter.id);
    res.send(filesCache);
  }

  async clearPrinterFiles(req, res) {
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

  async purgeIndexedFiles(req, res) {
    await this.filesStore.purgeFiles();

    res.send();
  }

  async moveFileOrFolder(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const { filePath: path, destination } = await validateMiddleware(req, moveFileOrFolderRules);

    const result = await this.octoPrintApiService.moveFileOrFolder(printerLogin, path, destination);

    // TODO Update file storage

    res.send(result);
  }

  async createFolder(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const { path, foldername } = await validateMiddleware(req, createFolderRules);

    const result = await this.octoPrintApiService.createFolder(printerLogin, path, foldername);

    // TODO Update file storage

    res.send(result);
  }

  async deleteFileOrFolder(req, res) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);
    const { path } = await validateInput(req.query, getFileRules);

    const result = await this.octoPrintApiService.deleteFileOrFolder(printerLogin, path);

    await this.filesStore.deleteFile(currentPrinterId, path, false);
    this.logger.log(`File reference removed, printerId ${currentPrinterId}`, path);

    res.send(result);
  }

  /**
   * @deprecated this API endpoint will be moved to /batch from BatchCallController in 1.4.0
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async batchReprintFiles(req, res) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const results = await this.batchCallService.batchReprintCalls(printerIds);
    res.send(results);
  }

  async selectAndPrintFile(req, res) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);
    const { filePath: path, print } = await validateInput(req.body, selectAndPrintFileRules);

    const result = await this.octoPrintApiService.selectPrintFile(printerLogin, path, print);

    await this.filesStore.setExistingFileForPrint(currentPrinterId, path);
    res.send(result);
  }

  async uploadFile(req, res) {
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
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async localUploadFile(req, res) {
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
}

// prettier-ignore
module.exports = createController(PrinterFilesController)
  .prefix(AppConstants.apiRoute + "/printer-files")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR]), printerResolveMiddleware()])
  .post("/purge", "purgeIndexedFiles", withPermission(PERMS.PrinterFiles.Clear))
  .get("/tracked-uploads", "getTrackedUploads", withPermission(PERMS.PrinterFiles.Upload))
  /**
   * @deprecated will be moved to /batch in 1.4.0
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
