import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { LoggerService } from "@/handlers/logger";
import { MongoIdType } from "@/shared.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IPrinterFilesService } from "@/services/interfaces/printer-files.service.interface";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { IPrinter } from "@/models/Printer";

/**
 * An extension repository for managing printer files in database
 */
export class PrinterFilesService implements IPrinterFilesService<MongoIdType> {
  printerService: IPrinterService<MongoIdType, IPrinter>;
  private logger: LoggerService;

  constructor({
    printerService,
    loggerFactory,
  }: {
    printerService: IPrinterService<MongoIdType>;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerService = printerService;
    this.logger = loggerFactory(PrinterFilesService.name);
  }

  async getPrinterFiles(printerId: MongoIdType) {
    const printer = await this.printerService.get(printerId);

    return printer.fileList;
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
    const foundFileIndex = printer.fileList.findIndex((f) => f.path === addedFile.path);
    if (foundFileIndex === -1) {
      printer.fileList.push(addedFile);
    } else {
      printer.fileList[foundFileIndex] = addedFile;
    }

    printer.markModified("fileList");
    await printer.save();

    return { fileList: printer.fileList };
  }

  async clearFiles(printerId: MongoIdType) {
    const printer = await this.printerService.get(printerId);
    printer.fileList = [];
    printer.markModified("fileList");
    await printer.save();
  }

  /**
   * Perform delete action on database
   **/
  async deleteFile(printerId: MongoIdType, filePath: string, throwError = true) {
    const printer = await this.printerService.get(printerId);

    const fileIndex = printer.fileList.findIndex((f) => f.path === filePath);

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

    printer.fileList.splice(fileIndex, 1);
    printer.markModified("fileList");
    await printer.save();
  }
}
