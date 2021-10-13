const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { findFileIndex } = require("./utils/find-predicate.utils");
const Logger = require("../handlers/logger.js");
const { Status } = require("../constants/service.constants");

/**
 * An extension repository for managing printer files in database
 */
class PrinterFilesService {
  #printerService;

  #logger = new Logger(PrinterFilesService.name);

  constructor({ printerService }) {
    this.#printerService = printerService;
  }

  async getPrinterFilesStorage(printerId) {
    const printer = await this.#printerService.get(printerId);

    return {
      fileList: printer.fileList,
      storage: printer.storage
    };
  }

  async updateFiles(printerId, fileList) {
    const printer = await this.#printerService.get(printerId);

    printer.fileList = fileList;
    printer.fileList.fileCount = printer.fileList.files.length;

    printer.markModified("fileList");
    printer.save();

    return printer.fileList;
  }

  async appendOrReplaceFile(printerId, addedFile) {
    const printer = await this.#printerService.get(printerId);

    const foundFileIndex = printer.fileList.files.findIndex((f) => f.path === addedFile.path);
    if (foundFileIndex === -1) {
      printer.fileList.files.push(addedFile);
    } else {
      printer.fileList.files[foundFileIndex] = addedFile;
    }
    printer.fileList.fileCount = printer.fileList.files.length;

    printer.markModified("fileList");
    await printer.save();

    return printer.fileList;
  }

  async clearFiles(printerId) {
    const printer = await this.#printerService.get(printerId);
    printer.fileList.files = [];
    printer.fileList.fileCount = 0;
    printer.markModified("fileList");
    await printer.save();
  }

  /**
   * Perform delete action on database
   * @param printerId
   * @param filePath
   * @param throwError when false no error will be thrown for a missing file
   * @returns {Promise<*>}
   */
  async deleteFile(printerId, filePath, throwError = true) {
    const printer = await this.#printerService.get(printerId);

    const fileIndex = findFileIndex(printer.fileList, filePath);

    if (fileIndex === -1) {
      if (throwError) {
        throw new NotFoundException(
          `A file removal was ordered but this file was not found in database for printer Id ${printerId}`,
          filePath
        );
      } else {
        return Status.failure("File was not found in printer fileList");
      }
    }

    printer.fileList.files.splice(fileIndex, 1);
    printer.fileList.fileCount = printer.fileList.files.length;
    printer.markModified("fileList");
    await printer.save();

    return Status.success("File was removed");
  }
}

module.exports = PrinterFilesService;
