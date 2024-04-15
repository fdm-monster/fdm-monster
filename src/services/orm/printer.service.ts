import { LoggerService } from "@/handlers/logger";
import { PrinterDto, PrinterUnsafeDto } from "@/services/interfaces/printer.dto";
import { Printer } from "@/entities/printer.entity";
import { BaseService } from "@/services/orm/base.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { normalizeURLWithProtocol } from "@/utils/url.utils";
import { validateInput } from "@/handlers/validators";
import { createPrinterRules } from "@/services/validators/printer-service.validation";
import { printerEvents } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { DeleteResult } from "typeorm";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class PrinterService
  extends BaseService(Printer, PrinterDto<SqliteIdType>)
  implements IPrinterService<SqliteIdType, Printer>
{
  logger: LoggerService;
  eventEmitter2: EventEmitter2;

  constructor({
    loggerFactory,
    typeormService,
    eventEmitter2,
  }: {
    loggerFactory: ILoggerFactory;
    typeormService: TypeormService;
    eventEmitter2: EventEmitter2;
  }) {
    super({ typeormService });
    this.logger = loggerFactory(PrinterService.name);
    this.eventEmitter2 = eventEmitter2;
  }

  toUnsafeDto(entity: Printer): PrinterUnsafeDto<SqliteIdType> {
    return {
      ...this.toDto(entity),
      apiKey: entity.apiKey,
      printerURL: entity.printerURL,
    };
  }

  toDto(entity: Printer): PrinterDto<SqliteIdType> {
    return {
      id: entity.id,
      name: entity.name,
      enabled: entity.enabled,
      disabledReason: entity.disabledReason,
      dateAdded: entity.dateAdded,
    };
  }

  async list(): Promise<Printer[]> {
    return this.repository.find({
      order: {
        dateAdded: "ASC",
      },
    });
  }

  /**
   * Stores a new printer into the database.
   */
  async create(newPrinter: PrinterUnsafeDto<SqliteIdType>, emitEvent = true): Promise<Printer> {
    if (newPrinter.id) {
      delete newPrinter.id;
    }

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
      partial.printerURL = normalizeURLWithProtocol(partial.printerURL);
    }
    Object.assign(printer, partial);
    const { printerURL, apiKey, enabled, name } = await validateInput(printer, createPrinterRules);

    const updatedPrinter = await super.update(printerId, {
      printerURL,
      name,
      apiKey,
      enabled,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer, updatedPrinter });
    return updatedPrinter;
  }

  async batchImport(printers: Partial<Printer>[]): Promise<Printer[]> {
    if (!printers?.length) return [];

    this.logger.log("Validating passed");
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

  override async delete(printerId: SqliteIdType, emitEvent = true): Promise<DeleteResult> {
    const result = await this.repository.delete([printerId]);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds: [[printerId]] });
    }
    return result;
  }

  async deleteMany(printerIds: SqliteIdType[], emitEvent = true): Promise<DeleteResult> {
    const result = await this.repository.delete(printerIds);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds });
    }
    return result;
  }

  updateConnectionSettings(printerId: SqliteIdType, partial: { printerUrl: string; apiKey: string }): Promise<Printer> {
    return this.update(printerId, partial);
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

  private async validateAndDefault(printer: Printer): Promise<Printer> {
    const mergedPrinter = {
      enabled: true,
      ...printer,
    };
    if (mergedPrinter.printerURL?.length) {
      mergedPrinter.printerURL = normalizeURLWithProtocol(mergedPrinter.printerURL);
    }
    return await validateInput(mergedPrinter, createPrinterRules);
  }
}
