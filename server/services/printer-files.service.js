const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { findFileIndex } = require("./utils/find-predicate.utils");
const Logger = require("../handlers/logger.js");

/**
 * An extension repository for managing printer files in database
 */
class PrinterFilesService {
  #printerService;

  #logger = new Logger(PrinterFilesService);

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
        this.#logger.warning(
          `A file removal was ordered but file '${filePath}' was not found in database for printer Id ${printerId}`
        );
      }
    }

    printer.fileList.files.splice(fileIndex, 1);
    printer.fileList.fileCount = printer.fileList.files.length;
    printer.markModified("fileList");
    printer.save();

    return printer.fileList;
  }
}

module.exports = PrinterFilesService;
