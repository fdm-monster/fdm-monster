const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const { validateMiddleware, validateInput } = require("../handlers/validators");
const { AppConstants } = require("../app.constants");
const { idRules } = require("./validation/generic.validation");
const {
  getFilesRules,
  deleteFileRules
} = require("./validation/printer-files-controller.validation");
const { ExternalServiceError } = require("../exceptions/runtime.exceptions");
const HttpStatusCode = require("../constants/http-status-codes.constants");

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

  async getFiles(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const { recursive } = await validateInput(req.query, getFilesRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const response = await this.#octoPrintApiService.getFiles(printerLogin, recursive, {
      unwrap: false
    });

    await this.#filesStore.updatePrinterFiles(printerId, response.data);

    res.statusCode = response.status;
    res.send(response.data);
  }

  async deleteFile(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const { fullPath } = await validateInput(req.query, deleteFileRules, res);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const response = await this.#octoPrintApiService.deleteFile(printerLogin, fullPath, {
      unwrap: false
    });

    const status = response.status;

    // Possibilities: CONFLICT, NOT FOUND or OK
    if (status === HttpStatusCode.CONFLICT) {
      // File was probably busy or printing
      throw new ExternalServiceError(response.data);
    }

    // NOT FOUND or NO_CONTENT - both should cause file to be dereferenced
    await this.#filesStore.removeFile(printerId, fullPath);
    this.#logger.info(`File reference removed for printerId ${printerId}`, fullPath);

    res.statusCode = status;
    res.send(response.data);
  }

  // === TODO BELOW ===
  async resyncFile(req, res) {
    const file = req.body;
    logger.info("Files Re-sync request for: ", file);
    let ret = null;

    // TODO no!
    // if (typeof file.fullPath !== "undefined") {
    //   ret = await Runner.reSyncFile(file.i, file.fullPath);
    // } else {
    //   ret = await Runner.getFiles(file.i, true);
    // }
    // Removed timeout... there's absolutely no reason for it.
    res.send(ret);
  }

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

  async createFile(req, res) {
    const data = req.body;
    logger.info("Adding a new file to server: ", data);
    Runner.newFile(data);
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
  .get("/:id", "getFiles")
  .delete("/:id", "deleteFile")
  // TODO below
  .post("/file/resync", "resyncFile")
  .post("/file/move", "moveFile")
  .post("/file/create", "createFile")
  .delete("/folder", "removeFolder")
  .delete("/folder/move", "moveFolder")
  .post("/folder/create", "createFolder");
