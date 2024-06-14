import { LoggerService } from "@/handlers/logger";
import { BaseService } from "@/services/orm/base.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterFile } from "@/entities/printer-file.entity";
import { SqliteIdType } from "@/shared.constants";
import { IPrinterFilesService } from "@/services/interfaces/printer-files.service.interface";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { CreateOrUpdatePrinterFileDto, PrinterFileDto } from "@/services/interfaces/printer-file.dto";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { Printer } from "@/entities";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { errorSummary } from "@/utils/error.utils";
import { captureException } from "@sentry/node";

export class PrinterFilesService extends BaseService(PrinterFile, PrinterFileDto) implements IPrinterFilesService<SqliteIdType> {
  printerService: IPrinterService<SqliteIdType, Printer>;
  private logger: LoggerService;

  constructor({
    printerService,
    loggerFactory,
    typeormService,
  }: {
    printerService: IPrinterService<SqliteIdType, Printer>;
    loggerFactory: ILoggerFactory;
    typeormService: TypeormService;
  }) {
    super({ typeormService });
    this.printerService = printerService;

    this.logger = loggerFactory(PrinterFilesService.name);
  }

  toDto(entity: PrinterFile): PrinterFileDto<SqliteIdType> {
    return {
      id: entity.id,
      printerId: entity.printerId,
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

  async getPrinterFiles(printerId: SqliteIdType): Promise<PrinterFile[]> {
    const printer = await this.printerService.get(printerId);
    return this.listPrinterFiles(printer.id);
  }

  async updateFiles(printerId: SqliteIdType, newFiles: CreateOrUpdatePrinterFileDto<SqliteIdType>[]): Promise<any> {
    const savedFiles = await this.getPrinterFiles(printerId);

    const newPaths = newFiles.map((f) => f.path);
    const deletableSavedFiles = savedFiles.filter((f) => !newPaths.includes(f.path));
    const deletableSavedFilePaths = deletableSavedFiles.map((f) => f.path);
    await this.deletePrinterFiles(printerId, deletableSavedFilePaths, false);

    for (const newFile of newFiles) {
      try {
        if (!newFile.hash?.length) {
          this.logger.log(`Skipping folder ${newFile.path}`);
          // A folder
          continue;
        }
        await this.appendOrReplaceFile(printerId, newFile);
      } catch (e) {
        captureException(e);
        this.logger.error(`Error appending file, skipping it`);
      }
    }

    return await this.getPrinterFiles(printerId);
  }

  async appendOrReplaceFile(printerId: SqliteIdType, addedFile: CreateOrUpdatePrinterFileDto<SqliteIdType>) {
    const printer = await this.printerService.get(printerId);
    addedFile.printerId = printer.id;
    if (!addedFile.customData) {
      addedFile.customData = {};
    }

    if (!addedFile?.hash?.length) {
      throw new Error("File without hash");
    }

    const foundFile = await this.getPrinterFile(printer.id, addedFile.path);
    if (!foundFile) {
      await this.create(addedFile);
    } else {
      await this.repository.update(
        {
          printerId: printer.id,
          path: addedFile.path,
        },
        addedFile
      );
    }

    return await this.getPrinterFiles(printer.id);
  }

  async clearFiles(printerId: SqliteIdType): Promise<void> {
    const printer = await this.printerService.get(printerId);
    await this.repository.delete({ printerId: printer.id });
  }

  async deletePrinterFiles(printerId: SqliteIdType, filePaths: string[], throwError: boolean): Promise<void> {
    const printer = await this.printerService.get(printerId);

    if (filePaths?.length === 0) return;
    if (!filePaths?.length) {
      throw new Error("Cant delete specific printer files without specific file path array being provided");
    }

    for (const filePath of filePaths) {
      const file = await this.getPrinterFile(printer.id, filePath);
      if (!file) {
        if (throwError) {
          throw new NotFoundException(`A file removal was ordered but this file was not found in database for printer`, filePath);
        } else {
          this.logger.warn("File was not found in PrinterFile table");
          return;
        }
      }

      await this.delete(file.id);
    }
  }

  private async listPrinterFiles(printerId: SqliteIdType) {
    return await this.list({
      where: {
        printerId,
      },
    });
  }

  private async getPrinterFile(printerId: SqliteIdType, filePath: string) {
    const printer = await this.printerService.get(printerId);
    return this.repository.findOneBy({
      printerId: printer.id,
      path: filePath,
    });
  }
}
