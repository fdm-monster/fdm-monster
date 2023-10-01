import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { findFileIndex } from "@/utils/find-predicate.utils";
import { LoggerService } from "@/handlers/logger";
import { PrinterService } from "@/services/printer.service";
import { MongoIdType } from "@/shared.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";

/**
 * An extension repository for managing printer files in database
 */
export class PrinterFilesService {
  printerService: PrinterService;
  private logger: LoggerService;

  constructor({ printerService, loggerFactory }: { printerService: PrinterService; loggerFactory: ILoggerFactory }) {
    this.printerService = printerService;
    this.logger = loggerFactory(PrinterFilesService.name);
  }

  async getPrinterFilesStorage(printerId: MongoIdType) {
    const printer = await this.printerService.get(printerId);

    return {
      fileList: printer.fileList,
      storage: printer.storage,
    };
  }

  async updateFiles(printerId: MongoIdType, fileList) {
    const printer = await this.printerService.get(printerId);

    printer.fileList = fileList;

    printer.markModified("fileList");
    await printer.save();

    return printer.fileList;
  }

  async appendOrReplaceFile(printerId: MongoIdType, addedFile) {
    const printer = await this.printerService.get(printerId);

    // TODO replace with file storage
    const foundFileIndex = printer.fileList.files.findIndex((f) => f.path === addedFile.path);
    if (foundFileIndex === -1) {
      printer.fileList.files.push(addedFile);
    } else {
      printer.fileList.files[foundFileIndex] = addedFile;
    }

    printer.markModified("fileList");
    await printer.save();

    // Only now are we allowed to adjust the last uploaded printer file
    let lastPrintedFile = {};
    try {
      lastPrintedFile = await this.setPrinterLastPrintedFile(printerId, addedFile.name);
    } catch (e) {
      this.logger.warn(`Parsing printer file did not succeed. Filename: ${addedFile}`);
    }

    return { fileList: printer.fileList, lastPrintedFile };
  }

  async setPrinterLastPrintedFile(printerId: MongoIdType, fileName) {
    await this.printerService.get(printerId);
    const lastPrintedFile = {
      fileName,
      editTimestamp: Date.now(),
    };
    const printer = await this.printerService.updateLastPrintedFile(printerId, lastPrintedFile);
    this.logger.log("Parsed and updated printer file", printer.lastPrintedFile);
    return printer.lastPrintedFile;
  }

  async clearFiles(printerId: MongoIdType) {
    const printer = await this.printerService.get(printerId);
    printer.fileList.files = [];
    printer.markModified("fileList");
    await printer.save();
  }

  /**
   * Perform delete action on database
   **/
  async deleteFile(printerId: MongoIdType, filePath: string, throwError = true) {
    const printer = await this.printerService.get(printerId);

    const fileIndex = findFileIndex(printer.fileList, filePath);

    if (fileIndex === -1) {
      if (throwError) {
        throw new NotFoundException(
          `A file removal was ordered but this file was not found in database for printer Id ${printerId}`,
          filePath
        );
      } else {
        this.logger.warn("File was not found in printer fileList");
      }
    }

    printer.fileList.files.splice(fileIndex, 1);
    printer.markModified("fileList");
    await printer.save();
  }
}
