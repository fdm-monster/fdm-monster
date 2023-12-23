import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { LoggerService } from "@/handlers/logger";
import { MongoIdType } from "@/shared.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IPrinterFilesService } from "@/services/interfaces/printer-files.service.interface";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { IPrinter } from "@/models/Printer";
import { PrinterFile } from "@/models";
import { PrinterFileDto } from "@/services/interfaces/printer-file.dto";
import { IPrinterFile } from "@/models/PrinterFile";

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
    printerService: IPrinterService<MongoIdType, IPrinter>;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerService = printerService;
    this.logger = loggerFactory(PrinterFilesService.name);
  }

  toDto(entity: IPrinterFile): PrinterFileDto<MongoIdType> {
    return {
      id: entity.id,
      printerId: entity.printerId?.toString(),
      name: entity.name,
      date: entity.date,
      display: entity.display,
      gcodeAnalysis: entity.gcodeAnalysis,
      hash: entity.hash,
      origin: entity.origin,
      path: entity.path,
      prints: entity.prints,
      refs: entity.refs,
      size: entity.size,
      statistics: entity.statistics,
      type: entity.type,
      typePath: entity.typePath,
    };
  }

  async getPrinterFiles(printerId: MongoIdType) {
    const printer = await this.printerService.get(printerId);
    return PrinterFile.find({ printerId: printer.id });
  }

  async updateFiles(printerId: MongoIdType, newFiles: PrinterFileDto[]) {
    const savedFiles = await this.getPrinterFiles(printerId);

    const newPaths = newFiles.map((f) => f.path);
    const deletableSavedFiles = savedFiles.filter((f) => !newPaths.includes(f.path));
    const deletableSavedFilePaths = deletableSavedFiles.map((f) => f.path);
    await this.deletePrinterFiles(printerId, deletableSavedFilePaths, false);

    for (const newFile of newFiles) {
      await this.appendOrReplaceFile(printerId, newFile);
    }

    return await this.getPrinterFiles(printerId);
  }

  async appendOrReplaceFile(printerId: MongoIdType, addedFile: PrinterFileDto) {
    const printer = await this.printerService.get(printerId);
    addedFile.printerId = printer.id;

    const foundFile = await this.getPrinterFile(printer.id, addedFile.path);
    if (!foundFile) {
      await PrinterFile.create(addedFile);
    } else {
      await PrinterFile.replaceOne(
        {
          printerId: printer.id,
          id: foundFile.id,
        },
        addedFile
      );
    }

    return await this.getPrinterFiles(printer.id);
  }

  async clearFiles(printerId: MongoIdType) {
    const printer = await this.printerService.get(printerId);
    await PrinterFile.deleteMany({
      printerId: printer.id,
    });
  }

  async deletePrinterFiles(printerId: MongoIdType, filePaths: string[], throwError = true) {
    const printer = await this.printerService.get(printerId);

    if (!filePaths?.length) {
      throw new Error("Cant delete specific printer files without specific file path array being provided");
    }

    for (const filePath of filePaths) {
      const file = await this.getPrinterFile(printerId, filePath);
      if (!file) {
        if (throwError) {
          throw new NotFoundException(
            `A file removal was ordered but this file was not found in database for printer Id ${printerId}`,
            filePath
          );
        } else {
          this.logger.warn("File was not found in PrinterFile table");
          return;
        }
      }

      await PrinterFile.deleteOne({
        printerId: printer.id,
        path: filePath,
      });
    }
  }

  private async getPrinterFile(printerId: MongoIdType, filePath: string) {
    const printer = await this.printerService.get(printerId);
    return PrinterFile.findOne({
      printerId: printer.id,
      path: filePath,
    });
  }
}
