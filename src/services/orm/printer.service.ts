import { LoggerService } from "@/handlers/logger";
import { CreatePrinterDto, PrinterDto } from "@/services/interfaces/printer.dto";
import { Printer } from "@/entities/printer.entity";
import { BaseService } from "@/services/orm/base.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { validateInput } from "@/handlers/validators";
import { printerEvents } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { normalizeUrl } from "@/utils/normalize-url";
import { defaultHttpProtocol } from "@/utils/url.utils";
import { createPrinterSchema } from "@/services/validators/printer-service.validation";
import { PrinterType } from "@/services/printer-api.interface";

export class PrinterService
  extends BaseService(Printer, PrinterDto<SqliteIdType>, CreatePrinterDto)
  implements IPrinterService<SqliteIdType, Printer>
{
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    typeormService: TypeormService,
    private readonly eventEmitter2: EventEmitter2,
  ) {
    super(typeormService);
    this.logger = loggerFactory(PrinterService.name);
  }

  toDto(entity: Printer): PrinterDto<SqliteIdType> {
    return {
      id: entity.id,
      name: entity.name,
      enabled: entity.enabled,
      disabledReason: entity.disabledReason,
      dateAdded: entity.dateAdded,
      apiKey: entity.apiKey,
      printerURL: entity.printerURL,
      printerType: entity.printerType as PrinterType,
    };
  }

  async list(): Promise<Printer[]> {
    return this.repository.find({
      order: {
        dateAdded: "ASC",
      },
    });
  }

  async create(newPrinter: CreatePrinterDto, emitEvent = true): Promise<Printer> {
    const mergedPrinter = await this.validateAndDefault(newPrinter);
    mergedPrinter.dateAdded = Date.now();
    const printer = await super.create(mergedPrinter);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printerCreated, { printer });
    }
    return printer;
  }

  /**
   * Explicit patching of printer document
   */
  async update(printerId: SqliteIdType, partial: Partial<Printer>): Promise<Printer> {
    const printer = await this.get(printerId);
    if (partial.printerURL) {
      partial.printerURL = normalizeUrl(partial.printerURL, { defaultProtocol: defaultHttpProtocol });
    }
    Object.assign(printer, partial);
    const { printerURL, apiKey, enabled, name, printerType } = await validateInput(printer, createPrinterSchema);

    const updatedPrinter = await super.update(printerId, {
      printerURL,
      name,
      apiKey,
      enabled,
      printerType,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer, updatedPrinter });
    return updatedPrinter;
  }

  async batchImport(printers: Partial<Printer>[]): Promise<Printer[]> {
    if (!printers?.length) return [];

    this.logger.log("Validation passed");
    for (let printer of printers) {
      await this.validateAndDefault(printer);
    }

    // We've passed validation completely - creation will likely succeed
    const newPrinters = [];
    for (let printer of printers) {
      const createdPrinter = await this.create(printer, false);
      newPrinters.push(createdPrinter);
    }

    this.logger.log("Batch create succeeded");
    this.eventEmitter2.emit(printerEvents.batchPrinterCreated, { printers: newPrinters });
    return newPrinters;
  }

  override async delete(printerId: SqliteIdType, emitEvent = true): Promise<void> {
    await this.repository.delete([printerId]);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds: [[printerId]] });
    }
  }

  async deleteMany(printerIds: SqliteIdType[], emitEvent = true): Promise<void> {
    await this.repository.delete(printerIds);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds });
    }
  }

  updateDisabledReason(printerId: SqliteIdType, disabledReason: string): Promise<Printer> {
    return this.update(printerId, { disabledReason });
  }

  updateEnabled(printerId: SqliteIdType, enabled: boolean): Promise<Printer> {
    return this.update(printerId, { enabled });
  }

  updateFeedRate(printerId: SqliteIdType, feedRate: number): Promise<Printer> {
    return this.update(printerId, { feedRate });
  }

  updateFlowRate(printerId: SqliteIdType, flowRate: number): Promise<Printer> {
    return this.update(printerId, { flowRate });
  }

  private async validateAndDefault(printer: CreatePrinterDto): Promise<Printer> {
    const mergedPrinter = {
      enabled: true,
      ...printer,
    };
    if (mergedPrinter.printerURL?.length) {
      mergedPrinter.printerURL = normalizeUrl(mergedPrinter.printerURL, { defaultProtocol: defaultHttpProtocol });
    }
    await validateInput(mergedPrinter, createPrinterSchema);

    return mergedPrinter;
  }
}
