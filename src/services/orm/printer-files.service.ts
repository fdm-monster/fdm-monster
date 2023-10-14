import { PrinterService } from "@/services/orm/printer.service";
import { LoggerService } from "@/handlers/logger";
import { BaseService } from "@/services/orm/base.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterFile } from "@/entities/printer-file.entity";
import { SqliteIdType } from "@/shared.constants";
import { IPrinterFilesService } from "@/services/interfaces/printer-files.service.interface";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { PrinterFileDto } from "@/services/interfaces/printer-file.dto";

export class PrinterFilesService extends BaseService(PrinterFile, PrinterFileDto) implements IPrinterFilesService<SqliteIdType> {
  printerService: PrinterService;
  private logger: LoggerService;

  constructor({
    printerService,
    loggerFactory,
    typeormService,
  }: {
    printerService: PrinterService;
    loggerFactory: ILoggerFactory;
    typeormService: TypeormService;
  }) {
    super({ typeormService });
    this.printerService = printerService;
    this.logger = loggerFactory(PrinterFilesService.name);
  }

  appendOrReplaceFile(printerId: SqliteIdType, addedFile): Promise<{ lastPrintedFile: {}; fileList: any }> {
    return Promise.resolve({ fileList: undefined, lastPrintedFile: {} });
  }

  clearFiles(printerId: SqliteIdType): Promise<void> {
    return Promise.resolve(undefined);
  }

  deleteFile(printerId: SqliteIdType, filePath: string, throwError: boolean): Promise<void> {
    return Promise.resolve(undefined);
  }

  getPrinterFilesStorage(printerId: SqliteIdType): Promise<{ storage: any; fileList: any }> {
    return Promise.resolve({ fileList: undefined, storage: undefined });
  }

  setPrinterLastPrintedFile(printerId: SqliteIdType, fileName: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  toDto(entity: T): DTO {
    return undefined;
  }

  updateFiles(printerId: SqliteIdType, fileList): Promise<any> {
    return Promise.resolve(undefined);
  }
}
