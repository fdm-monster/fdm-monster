const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const { validateInput, validateScoped, validateMiddleware } = require("../handlers/validators");
const { AppConstants } = require("../app.constants");
const { idRules } = require("./validation/generic.validation");
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
const { ExternalServiceError, ValidationException } = require("../exceptions/runtime.exceptions");
const HttpStatusCode = require("../constants/http-status-codes.constants");
const { Status } = require("../constants/service.constants");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  currentPrinterToken,
  printerLoginToken,
  printerResolveMiddleware
} = require("../middleware/printer");

class PrinterFileController {
  #filesStore;

  #octoPrintApiService;
  #printersStore;

  // Scoped middleware
  #currentPrinter;
  #printerLogin;

  #logger = new Logger("Server-API");

  constructor({ filesStore, octoPrintApiService, printersStore, currentPrinter, printerLogin }) {
    this.#filesStore = filesStore;
    this.#octoPrintApiService = octoPrintApiService;
    this.#printersStore = printersStore;
    this.#currentPrinter = currentPrinter;
    this.#printerLogin = printerLogin;
  }

  #fileFilter(req, file, callback) {
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
    const { id: printerId } = await validateInput(req.params, idRules);
    const { recursive } = await validateInput(req.query, getFilesRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const response = await this.#octoPrintApiService.getFiles(printerLogin, recursive, {
      unwrap: false,
      simple: true
    });

    await this.#filesStore.updatePrinterFiles(printerId, response.data);

    this.#statusResponse(res, response);
  }

  /**
   * When the printer host is not reachable or is disabled the cache is still accessible
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async getFilesCache(req, res) {
    const { currentPrinter } = validateScoped(req, [currentPrinterToken]);

    const filesCache = await this.#filesStore.getFiles(currentPrinter.id);

    res.send(filesCache);
  }

  async getFile(req, res) {
    const { currentPrinter, printerLogin } = validateScoped(req, [
      currentPrinterToken,
      printerLoginToken
    ]);
    const { fullPath } = await validateInput(req.query, getFileRules, res);

    const response = await this.#octoPrintApiService.getFile(printerLogin, fullPath, {
      unwrap: false,
      simple: true
    });

    await this.#filesStore.updatePrinterFiles(currentPrinter.id, response.data);

    this.#statusResponse(res, response);
  }

  async clearPrinterFiles(req, res) {
    const { currentPrinter, printerLogin } = validateScoped(req, [
      currentPrinterToken,
      printerLoginToken
    ]);

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

    await this.#filesStore.purgePrinterFiles(currentPrinter.id);

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
    const { printerLogin } = validateScoped(req, [printerLoginToken]);
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
    const { printerLogin } = validateScoped(req, [printerLoginToken]);
    const { path, foldername } = await validateMiddleware(req, createFolderRules);

    const result = await this.#octoPrintApiService.createFolder(printerLogin, path, foldername);

    // TODO Update file storage

    res.send(result);
  }

  async deleteFileOrFolder(req, res) {
    const { printerLogin } = validateScoped(req, [printerLoginToken]);
    const { filePath: path } = await validateInput(req.body, moveFileOrFolderRules);

    const result = await this.#octoPrintApiService.deleteFileOrFolder(printerLogin, path);

    // TODO Update file storage

    res.send(result);
  }

  async selectAndPrintFile(req, res) {
    const { printerLogin } = validateScoped(req, [printerLoginToken]);

    const { filePath: path, print } = await validateInput(req.body, selectAndPrintFileRules);

    const result = await this.#octoPrintApiService.selectPrintFile(printerLogin, path, print);

    res.send(result);
  }

  async uploadFiles(req, res) {
    const { printerLogin } = validateScoped(req, [printerLoginToken]);
    const {} = await validateInput(req.query, uploadFilesRules);

    const uploadAny = multer({
      storage: multer.memoryStorage(),
      fileFilter: this.#fileFilter
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
      await this.#filesStore.appendOrSetPrinterFile(printerId, newOrUpdatedFile);
    }

    res.send(response);
  }

  async localUploadFile(req, res) {
    const { currentPrinter, printerLogin } = validateScoped(req, [
      printerLoginToken,
      currentPrinterToken
    ]);

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
      await this.#filesStore.appendOrSetPrinterFile(currentPrinter.id, newOrUpdatedFile);
    }

    res.send(response);
  }

  async stubUploadFiles(req, res) {
    const uploadAnyDisk = multer({
      storage: multer.diskStorage({
        destination: "./file-uploads"
      }),

      fileFilter: this.#fileFilter
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

  async deleteFile(req, res) {
    const { currentPrinter, printerLogin } = validateScoped(req, [
      printerLoginToken,
      currentPrinterToken
    ]);
    const { filePath } = await validateInput(req.query, getFileRules, res);

    let response;
    try {
      response = await this.#octoPrintApiService.deleteFile(printerLogin, filePath, {
        unwrap: false,
        simple: true // Keeps only status and data props
      });
    } catch (e) {
      // NOT_FOUND or NO_CONTENT fall through
      if (e.response?.status === HttpStatusCode.CONFLICT) {
        // File was probably busy or printing
        throw new ExternalServiceError(e.response.data);
      } else if (e.response?.status === HttpStatusCode.NOT_FOUND) {
        response = Status.failure("OctoPrint indicated file was not found");
      }
    }

    const combinedResult = await this.#filesStore.deleteFile(currentPrinter.id, filePath, false);
    this.#logger.info(
      `File reference removal completed for printerId ${currentPrinter.id}`,
      filePath
    );

    const totalResult = { octoPrint: response, ...combinedResult };
    res.send(totalResult);
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
