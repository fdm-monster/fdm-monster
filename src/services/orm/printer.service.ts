import { LoggerService } from "@/handlers/logger";
import { CreatePrinterDto, PrinterDto } from "@/services/interfaces/printer.dto";
import { Printer } from "@/entities/printer.entity";
import { BaseService } from "@/services/orm/base.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { validateInput } from "@/handlers/validators";
import {
  BatchPrinterCreatedEvent,
  PrinterCreatedEvent,
  printerEvents,
  PrintersDeletedEvent,
  PrinterUpdatedEvent,
} from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { normalizeUrl } from "@/utils/normalize-url";
import { defaultHttpProtocol } from "@/utils/url.utils";
import {
  createPrinterSchema,
  updatePrinterDisabledReasonSchema,
  updatePrinterEnabledSchema
} from "@/services/validators/printer-service.validation";
import { PrinterType } from "@/services/printer-api.interface";
import { z } from "zod";

export class PrinterService extends BaseService(Printer, PrinterDto, CreatePrinterDto) implements IPrinterService {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    typeormService: TypeormService,
    private readonly eventEmitter2: EventEmitter2,
  ) {
    super(typeormService);
    this.logger = loggerFactory(PrinterService.name);
  }

  toDto(entity: Printer): PrinterDto {
    return {
      id: entity.id,
      name: entity.name,
      enabled: entity.enabled,
      disabledReason: entity.disabledReason,
      dateAdded: entity.dateAdded,
      apiKey: entity.apiKey,
      username: entity.username,
      password: entity.password,
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

  async create(newPrinter: z.infer<typeof createPrinterSchema>, emitEvent = true): Promise<Printer> {
    const mergedPrinter = await this.validateAndDefault(newPrinter);
    mergedPrinter.dateAdded = Date.now();
    const printer = await super.create(mergedPrinter);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printerCreated, { printer } satisfies PrinterCreatedEvent);
    }
    return printer;
  }

  /**
   * Explicit patching of printer document
   */
  async update(printerId: number, partial: Partial<Printer>): Promise<Printer> {
    const printer = await this.get(printerId);
    if (partial.printerURL) {
      partial.printerURL = normalizeUrl(partial.printerURL, { defaultProtocol: defaultHttpProtocol });
    }
    Object.assign(printer, partial);
    const { printerURL, apiKey, enabled, name, printerType, password, username } = await validateInput(
      printer,
      createPrinterSchema,
    );

    const updatedPrinter = await super.update(printerId, {
      printerURL,
      name,
      apiKey,
      enabled,
      printerType,
      password: password ?? undefined,
      username: username ?? undefined,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer } satisfies PrinterUpdatedEvent);
    return updatedPrinter;
  }

  async batchImport(printers: Partial<Printer>[]): Promise<Printer[]> {
    if (!printers?.length) return [];

    const validatedPrinters = [];
    for (let printer of printers) {
      const validated = await this.validateAndDefault(printer as z.infer<typeof createPrinterSchema>);
      validatedPrinters.push(validated);
    }

    this.logger.log("Validation passed");
    // We've passed validation completely - creation will likely succeed
    const newPrinters = [];
    for (let printer of validatedPrinters) {
      const createdPrinter = await this.create(printer, false);
      newPrinters.push(createdPrinter);
    }

    this.logger.log("Batch create succeeded");
    this.eventEmitter2.emit(printerEvents.batchPrinterCreated, {
      printers: newPrinters,
    } satisfies BatchPrinterCreatedEvent);
    return newPrinters;
  }

  override async delete(printerId: number, emitEvent = true): Promise<void> {
    await this.repository.delete([printerId]);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, {
        printerIds: [printerId],
      } satisfies PrintersDeletedEvent);
    }
  }

  async deleteMany(printerIds: number[], emitEvent = true): Promise<void> {
    await this.repository.delete(printerIds);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds } satisfies PrintersDeletedEvent);
    }
  }

  async updateDisabledReason(printerId: number, disabledReason: string | null): Promise<Printer> {
    await validateInput({ disabledReason }, updatePrinterDisabledReasonSchema);
    return this.update(printerId, { disabledReason });
  }

  async updateEnabled(printerId: number, enabled: boolean): Promise<Printer> {
    await validateInput({ enabled }, updatePrinterEnabledSchema);
    return this.update(printerId, { enabled });
  }

  updateFeedRate(printerId: number, feedRate: number): Promise<Printer> {
    return this.update(printerId, { feedRate });
  }

  updateFlowRate(printerId: number, flowRate: number): Promise<Printer> {
    return this.update(printerId, { flowRate });
  }

  private async validateAndDefault(printer: z.infer<typeof createPrinterSchema>) {
    const mergedPrinter = {
      enabled: true,
      ...printer,
    };
    if (mergedPrinter.printerURL?.length) {
      mergedPrinter.printerURL = normalizeUrl(mergedPrinter.printerURL, { defaultProtocol: defaultHttpProtocol });
    }
    return await validateInput(mergedPrinter, createPrinterSchema);
  }
}
