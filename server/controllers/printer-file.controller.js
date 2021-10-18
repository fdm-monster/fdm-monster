const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const { validateInput, getScopedPrinter, validateMiddleware } = require("../handlers/validators");
const { AppConstants } = require("../app.constants");
const {
  getFilesRules,
  getFileRules,
  uploadFilesRules,
  fileUploadCommandsRules,
  selectAndPrintFileRules,
  localFileUploadRules,
  moveFileOrFolderRules,
  createFolderRules
} = require("./validation/printer-files-controller.validation");
const { ValidationException } = require("../exceptions/runtime.exceptions");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  printerLoginToken,
  printerResolveMiddleware
} = require("../middleware/printer");

class PrinterFileController {
  #filesStore;

  #octoPrintApiService;
  #printersStore;

  #logger = new Logger("Server-API");

  constructor({ filesStore, octoPrintApiService, printersStore }) {
    this.#filesStore = filesStore;
    this.#octoPrintApiService = octoPrintApiService;
    this.#printersStore = printersStore;
  }

  #gcodeFileFilter(req, file, callback) {
    const ext = path.extname(file.originalname);
    if (ext !== ".gcode") {
      return callback(new Error("Only .gcode files are allowed"));
    }
    callback(null, true);
  }

  #statusResponse(res, response) {
    res.statusCode = response.status;
    res.send(response.data);
  }

  async getFiles(req, res) {
    const { printerLogin, currentPrinterId } = getScopedPrinter(req);
    const { recursive } = await validateInput(req.query, getFilesRules);

    const response = await this.#octoPrintApiService.getFiles(printerLogin, recursive, {
      unwrap: false,
      simple: true
    });

    await this.#filesStore.updatePrinterFiles(currentPrinterId, response.data);

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

    const filesCache = await this.#filesStore.getFiles(currentPrinter.id);

    res.send(filesCache);
  }

  async getFile(req, res) {
    const { currentPrinter, printerLogin } = getScopedPrinter(req);
    const { filePath } = await validateInput(req.query, getFileRules, res);

    const response = await this.#octoPrintApiService.getFile(printerLogin, filePath, {
      unwrap: false,
      simple: true
    });

    await this.#filesStore.appendOrSetPrinterFile(currentPrinter.id, response.data);

    this.#statusResponse(res, response);
  }

  async clearPrinterFiles(req, res) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);

    const nonRecursiveFiles = await this.#octoPrintApiService.getFiles(printerLogin, false);

    const failedFiles = [];
    const succeededFiles = [];

    for (let file of nonRecursiveFiles.files) {
      try {
        await this.#octoPrintApiService.deleteFile(printerLogin, file.path);
        succeededFiles.push(file);
      } catch (e) {
        failedFiles.push(file);
      }
    }

    await this.#filesStore.purgePrinterFiles(currentPrinterId);

    res.send({
      failedFiles,
      succeededFiles
    });
  }

  async purgeIndexedFiles(req, res) {
    await this.#filesStore.purgeFiles();

    res.send();
  }

  async moveFileOrFolder(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const { filePath: path, destination } = await validateMiddleware(req, moveFileOrFolderRules);

    const result = await this.#octoPrintApiService.moveFileOrFolder(
      printerLogin,
      path,
      destination
    );

    // TODO Update file storage

    res.send(result);
  }

  async createFolder(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const { path, foldername } = await validateMiddleware(req, createFolderRules);

    const result = await this.#octoPrintApiService.createFolder(printerLogin, path, foldername);

    // TODO Update file storage

    res.send(result);
  }

  async deleteFileOrFolder(req, res) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);
    const { filePath } = await validateInput(req.query, getFileRules);

    const result = await this.#octoPrintApiService.deleteFileOrFolder(printerLogin, filePath);

    await this.#filesStore.deleteFile(currentPrinterId, filePath, false);
    this.#logger.info(`File reference removed, printerId ${currentPrinterId}`, filePath);

    res.send(result);
  }

  async selectAndPrintFile(req, res) {
    const { printerLogin } = getScopedPrinter(req, [printerLoginToken]);
    const { filePath: path, print } = await validateInput(req.body, selectAndPrintFileRules);

    const result = await this.#octoPrintApiService.selectPrintFile(printerLogin, path, print);

    res.send(result);
  }

  async uploadFiles(req, res) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);
    const {} = await validateInput(req.query, uploadFilesRules);

    const uploadAny = multer({
      storage: multer.memoryStorage(),
      fileFilter: this.#gcodeFileFilter
    }).any();

    await new Promise((resolve, reject) =>
      uploadAny(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      })
    );

    if (req.files.length === 0)
      throw new ValidationException({
        error: "No files were available for upload. Did you upload files with extension '.gcode'?"
      });

    // Multer has processed the remaining multipart data into the body as json
    const commands = await validateInput(req.body, fileUploadCommandsRules);
    const response = await this.#octoPrintApiService.uploadFilesAsMultiPart(
      printerLogin,
      req.files,
      commands
    );

    if (response.success !== false) {
      const newOrUpdatedFile = response.files.local;
      await this.#filesStore.appendOrSetPrinterFile(currentPrinterId, newOrUpdatedFile);
    }

    res.send(response);
  }

  async localUploadFile(req, res) {
    const { currentPrinterId, printerLogin } = getScopedPrinter(req);

    // Multer has processed the remaining multipart data into the body as json
    const { select, print, localLocation } = await validateInput(req.body, localFileUploadRules);

    const stream = fs.createReadStream(localLocation);

    const response = await this.#octoPrintApiService.uploadFilesAsMultiPart(
      printerLogin,
      [stream],
      { select, print }
    );

    // TODO update file cache with files store
    if (response.success !== false) {
      const newOrUpdatedFile = response.files.local;
      await this.#filesStore.appendOrSetPrinterFile(currentPrinterId, newOrUpdatedFile);
    }

    res.send(response);
  }

  async stubUploadFiles(req, res) {
    const uploadAnyDisk = multer({
      storage: multer.diskStorage({
        destination: "./file-uploads"
      }),

      fileFilter: this.#gcodeFileFilter
    }).any();

    await new Promise((resolve, reject) =>
      uploadAnyDisk(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      })
    );

    this.#logger.info("Stub file upload complete.");
    res.send();
  }
}

// prettier-ignore
module.exports = createController(PrinterFileController)
    .prefix(AppConstants.apiRoute + "/printer-files")
    .before([ensureAuthenticated, printerResolveMiddleware()])
    .post("/purge", "purgeIndexedFiles")
    .post("/stub-upload", "stubUploadFiles")
    .get("/:id", "getFiles")
    .get("/:id/cache", "getFilesCache")
    .delete("/:id", "deleteFileOrFolder")
    .post("/:id/local-upload", "localUploadFile")
    .post("/:id/upload", "uploadFiles")
    .post("/:id/create-folder", "createFolder")
    .post("/:id/select", "selectAndPrintFile")
    .post("/:id/move", "moveFileOrFolder")
    .delete("/:id/clear", "clearPrinterFiles");
