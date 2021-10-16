const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const { validateMiddleware, validateInput } = require("../handlers/validators");
const { AppConstants } = require("../app.constants");
const { idRules } = require("./validation/generic.validation");
const {
  getFilesRules,
  getFileRules,
  uploadFilesRules,
  fileUploadCommandsRules,
  selectPrintFile,
  localFileUploadRules
} = require("./validation/printer-files-controller.validation");
const { ExternalServiceError, ValidationException } = require("../exceptions/runtime.exceptions");
const HttpStatusCode = require("../constants/http-status-codes.constants");
const { Status } = require("../constants/service.constants");
const multer = require("multer");
const path = require("path");
const { FileLocation } = require("../services/octoprint/constants/octoprint-service.constants");
const fs = require("fs");

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

  #multiActionResponse(res, status, actionResults) {
    res.statusCode = status;
    res.send(actionResults);
  }

  async getFiles(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const { recursive, location } = await validateInput(req.query, getFilesRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const response = await this.#octoPrintApiService.getFiles(printerLogin, recursive, location, {
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
    const { id: printerId } = await validateInput(req.params, idRules);

    const filesCache = await this.#filesStore.getFiles(printerId);

    res.send(filesCache);
  }

  async getFile(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const { fullPath } = await validateInput(req.query, getFileRules, res);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const response = await this.#octoPrintApiService.getFile(printerLogin, fullPath, {
      unwrap: false,
      simple: true
    });

    await this.#filesStore.updatePrinterFiles(printerId, response.data);

    this.#statusResponse(res, response);
  }

  async clearPrinterFiles(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

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

    await this.#filesStore.purgePrinterFiles(printerId);

    res.send({
      failedFiles,
      succeededFiles
    });
  }

  async purgeIndexedFiles(req, res) {
    await this.#filesStore.purgeFiles();

    res.send();
  }

  async selectPrintFile(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const { fullPath: path, location, print } = await validateInput(req.body, selectPrintFile);

    const command = this.#octoPrintApiService.selectCommand(print);
    await this.#octoPrintApiService.selectPrintFile(printerLogin, path, location, command);

    res.send(Status.success(`Select file (print=${print}) command sent`));
  }

  async uploadFiles(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const { location } = await validateInput(req.query, uploadFilesRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

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
      commands,
      location
    );

    // TODO update file cache with files store
    if (location === FileLocation.local && response.success !== false) {
      const newOrUpdatedFile = response.files.local;
      await this.#filesStore.appendOrSetPrinterFile(printerId, newOrUpdatedFile);
    }

    res.send(response);
  }

  async localUploadFile(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    // Multer has processed the remaining multipart data into the body as json
    const { select, print, location, localLocation } = await validateInput(
      req.body,
      localFileUploadRules
    );

    const stream = fs.createReadStream(localLocation);

    const response = await this.#octoPrintApiService.uploadFilesAsMultiPart(
      printerLogin,
      [stream],
      { select, print },
      location
    );

    // TODO update file cache with files store
    if (location === FileLocation.local && response.success !== false) {
      const newOrUpdatedFile = response.files.local;
      await this.#filesStore.appendOrSetPrinterFile(printerId, newOrUpdatedFile);
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
    const { id: printerId } = await validateInput(req.params, idRules);
    const { fullPath, location } = await validateInput(req.query, getFileRules, res);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    let response;
    try {
      response = await this.#octoPrintApiService.deleteFile(printerLogin, fullPath, location, {
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

    const combinedResult = await this.#filesStore.deleteFile(printerId, fullPath, false);
    this.#logger.info(`File reference removal completed for printerId ${printerId}`, fullPath);

    const totalResult = { octoPrint: response, ...combinedResult };
    this.#multiActionResponse(res, 200, totalResult);
  }

  // === TODO BELOW ===
  async moveFile(req, res) {
    const data = req.body;
    if (data.newPath === "/") {
      data.newPath = "local";
      data.newFullPath = data.newFullPath.replace("//", "");
    }
    logger.info("Move file request: ", data);
    Runner.moveFile(data.index, data.newPath, data.newFullPath, data.fileName);
    res.send({ msg: "success" });
  }

  // Folder actions below
  async removeFolder(req, res) {
    const folder = req.body;
    logger.info("Folder deletion request: ", folder.fullPath);
    await Runner.deleteFolder(folder.index, folder.fullPath);
    res.send(true);
  }

  async moveFolder(req, res) {
    const data = req.body;
    logger.info("Move folder request: ", data);
    Runner.moveFolder(data.index, data.oldFolder, data.newFullPath, data.folderName);
    res.send({ msg: "success" });
  }

  async createFolder(req, res) {
    const data = req.body;
    logger.info("New folder request: ", data);
    Runner.newFolder(data);
    res.send({ msg: "success" });
  }
}

// prettier-ignore
module.exports = createController(PrinterFileController)
    .prefix(AppConstants.apiRoute + "/printer-files")
    .before([ensureAuthenticated])
    .post("/purge", "purgeIndexedFiles")
    .post("/stub-upload", "stubUploadFiles")
    .get("/:id", "getFiles")
    .get("/:id/cache", "getFilesCache")
    .delete("/:id", "deleteFile")
    .post("/:id/local-upload", "localUploadFile")
    .post("/:id/upload", "uploadFiles")
    .post("/:id/select", "selectPrintFile")
    .post("/:id/clear", "clearPrinterFiles")
    // TODO below
    .post("/file/resync", "resyncFile")
    .post("/file/move", "moveFile")
    .post("/file/create", "createFile")
    .delete("/folder", "removeFolder")
    .delete("/folder/move", "moveFolder")
    .post("/folder/create", "createFolder");
