import EventEmitter2 from "eventemitter2";
import { Printer } from "@/models";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { validateInput } from "@/handlers/validators";
import {
  createPrinterSchema,
  updatePrinterDisabledReasonSchema,
  updatePrinterEnabledSchema,
} from "../validators/printer-service.validation";
import {
  BatchPrinterCreatedEvent,
  PrinterCreatedEvent,
  printerEvents,
  PrintersDeletedEvent,
  PrinterUpdatedEvent,
} from "@/constants/event.constants";
import { LoggerService } from "@/handlers/logger";
import { MongoIdType } from "@/shared.constants";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterDto } from "@/services/interfaces/printer.dto";
import { IPrinter } from "@/models/Printer";
import { normalizeUrl } from "@/utils/normalize-url";
import { defaultHttpProtocol } from "@/utils/url.utils";
import { z } from "zod";

export class PrinterService implements IPrinterService<MongoIdType> {
  logger: LoggerService;

  constructor(
    private readonly eventEmitter2: EventEmitter2,
    loggerFactory: ILoggerFactory,
  ) {
    this.logger = loggerFactory(PrinterService.name);
  }

  toDto(entity: IPrinter): PrinterDto<MongoIdType> {
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
      printerType: entity.printerType,
    };
  }

  async list() {
    return Printer.find({}, null, {
      sort: { dateAdded: 1 },
    });
  }

  async get(printerId: MongoIdType) {
    const filter = { _id: printerId };
    const printer = await Printer.findOne(filter);

    if (!printer) {
      throw new NotFoundException(`The printer with provided id was not found`);
    }

    return printer;
  }

  async create(newPrinter: z.infer<typeof createPrinterSchema>, emitEvent = true) {
    if (!newPrinter) throw new Error("Missing printer to create");

    const mergedPrinter = await this.validateAndDefault(newPrinter);
    mergedPrinter.dateAdded = Date.now();
    const printer = await Printer.create(mergedPrinter);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printerCreated, { printer } satisfies PrinterCreatedEvent<string>);
    }
    return printer;
  }

  /**
   * Explicit patching of printer document
   * @param printerId
   * @param updateData
   * @returns {Promise<Query<Document<any, any, unknown> | null, Document<any, any, unknown>, {}, unknown>>}
   */
  async update(printerId: MongoIdType, updateData: z.infer<typeof createPrinterSchema>) {
    const printer = await this.get(printerId);
    updateData.printerURL = normalizeUrl(updateData.printerURL, { defaultProtocol: defaultHttpProtocol });
    const {
      printerURL,
      apiKey,
      username,
      password,
      enabled,
      name,
      printerType,
    } = await validateInput(updateData, createPrinterSchema);

    printer.printerURL = printerURL;
    printer.apiKey = apiKey;
    printer.username = username;
    printer.password = password;
    if (enabled !== undefined) {
      printer.enabled = enabled;
    }
    printer.name = name;
    printer.printerType = printerType;
    await printer.save();
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer } satisfies PrinterUpdatedEvent<string>);
    return printer;
  }

  async deleteMany(printerIds: MongoIdType[], emitEvent = true) {
    await Printer.deleteMany({ _id: { $in: printerIds } });
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds } satisfies PrintersDeletedEvent<string>);
    }
  }

  async delete(printerId: MongoIdType, emitEvent = true): Promise<void> {
    const filter = { _id: printerId };

    await Printer.findOneAndDelete(filter);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, {
        printerIds: [printerId],
      } satisfies PrintersDeletedEvent<string>);
    }
  }

  async batchImport(printers: z.infer<typeof createPrinterSchema>[]) {
    if (!printers?.length) return [];
    for (let printer of printers) {
      await this.validateAndDefault(printer);
    }
    this.logger.log("Validation passed");

    // We've passed validation completely - creation will likely succeed
    const newPrinters = [];
    for (let printer of printers) {
      const createdPrinter = await this.create(printer, false);
      newPrinters.push(createdPrinter);
    }

    this.logger.log("Batch create succeeded");
    this.eventEmitter2.emit(printerEvents.batchPrinterCreated, {
      printers: newPrinters,
    } satisfies BatchPrinterCreatedEvent<string>);
    return newPrinters;
  }

  async updateFlowRate(printerId: MongoIdType, flowRate?: number) {
    const update = { flowRate };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    if (printer) {
      this.eventEmitter2.emit(printerEvents.printerUpdated, { printer } satisfies PrinterUpdatedEvent<string>);
    }
    return printer!;
  }

  async updateFeedRate(printerId: MongoIdType, feedRate?: number) {
    const update = { feedRate };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    if (printer) {
      this.eventEmitter2.emit(printerEvents.printerUpdated, { printer } satisfies PrinterUpdatedEvent<string>);
    }
    return printer!;
  }

  async updateEnabled(printerId: MongoIdType, enabled: boolean) {
    const update = enabled
      ? {
        enabled,
        disabledReason: null,
      }
      : { enabled };

    await validateInput(update, updatePrinterEnabledSchema);
    await this.get(printerId);

    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    if (printer) {
      this.eventEmitter2.emit(printerEvents.printerUpdated, { printer } satisfies PrinterUpdatedEvent<string>);
    }
    return printer!;
  }

  async updateDisabledReason(printerId: MongoIdType, disabledReason?: string) {
    const enabled = !disabledReason?.length;
    const update = {
      disabledReason,
      enabled,
    };

    await validateInput(update, updatePrinterDisabledReasonSchema);
    await this.get(printerId);

    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    if (printer) {
      this.eventEmitter2.emit(printerEvents.printerUpdated, { printer } satisfies PrinterUpdatedEvent<string>);
    }
    return printer!;
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
