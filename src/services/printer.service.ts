import EventEmitter2 from "eventemitter2";
import { Printer } from "@/models";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { validateInput } from "@/handlers/validators";
import {
  createMongoPrinterRules,
  updatePrinterDisabledReasonRule,
  updatePrinterEnabledRule,
} from "./validators/printer-service.validation";
import { getDefaultPrinterEntry } from "@/constants/service.constants";
import { printerEvents } from "@/constants/event.constants";
import { LoggerService } from "@/handlers/logger";
import { normalizeURLWithProtocol } from "@/utils/url.utils";
import { MongoIdType } from "@/shared.constants";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { Type } from "@/services/orm/base.interface";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class PrinterService implements IPrinterService<MongoIdType> {
  eventEmitter2: EventEmitter2;
  logger: LoggerService;

  constructor({ eventEmitter2, loggerFactory }: { eventEmitter2: EventEmitter2; loggerFactory: ILoggerFactory }) {
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(PrinterService.name);
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
      throw new NotFoundException(`The printer ID '${printerId}' is not an existing printer.`);
    }

    return printer;
  }

  /**
   * Stores a new printer into the database.
   * @param {Object} newPrinter object to create.
   * @param {boolean} emitEvent
   * @throws {Error} If the printer is not correctly provided.
   */
  async create(newPrinter, emitEvent = true) {
    if (!newPrinter) throw new Error("Missing printer");

    const mergedPrinter = await this.validateAndDefault(newPrinter);
    mergedPrinter.dateAdded = Date.now();
    const printer = await Printer.create(mergedPrinter);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printerCreated, { printer });
    }
    return printer;
  }

  /**
   * Explicit patching of printer document
   * @param printerId
   * @param updateData
   * @returns {Promise<Query<Document<any, any, unknown> | null, Document<any, any, unknown>, {}, unknown>>}
   */
  async update(printerId: MongoIdType, updateData) {
    const printer = await this.get(printerId);
    updateData.printerURL = normalizeURLWithProtocol(updateData.printerURL);
    const { printerURL, apiKey, enabled, settingsAppearance } = await validateInput(updateData, createMongoPrinterRules);

    printer.printerURL = printerURL;
    printer.apiKey = apiKey;
    if (enabled !== undefined) {
      printer.enabled = enabled;
    }
    printer.settingsAppearance.name = settingsAppearance.name;
    await printer.save();
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async deleteMany(printerIds: MongoIdType[], emitEvent = true) {
    await Printer.deleteMany({ _id: { $in: printerIds } });
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds });
    }
  }

  async delete(printerId: MongoIdType, emitEvent = true): Promise<void> {
    const filter = { _id: printerId };

    await Printer.findOneAndDelete(filter);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds: [printerId] });
    }
  }

  async batchImport(printers: Partial<typeof Printer>[]) {
    if (!printers?.length) return [];

    this.logger.log(`Validating ${printers.length} printer objects`);
    for (let printer of printers) {
      await this.validateAndDefault(printer);
    }

    this.logger.log(`Validation passed. Creating ${printers.length} printers`);

    // We've passed validation completely - creation will likely succeed
    const newPrinters = [];
    for (let printer of printers) {
      const createdPrinter = await this.create(printer, false);
      newPrinters.push(createdPrinter);
    }

    this.logger.log(`Successfully created ${printers.length} printers`);
    this.eventEmitter2.emit(printerEvents.batchPrinterCreated, { printers: newPrinters });
    return newPrinters;
  }

  async updateLastPrintedFile(printerId: MongoIdType, lastPrintedFile) {
    const update = { lastPrintedFile };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateFlowRate(printerId: MongoIdType, flowRate: number) {
    const update = { flowRate };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateFeedRate(printerId: MongoIdType, feedRate: number) {
    const update = { feedRate };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateConnectionSettings(printerId: MongoIdType, { printerURL, apiKey }) {
    const update = {
      printerURL: normalizeURLWithProtocol(printerURL),
      apiKey,
    };

    await validateInput(update, createMongoPrinterRules);
    await this.get(printerId);

    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateEnabled(printerId: MongoIdType, enabled: boolean) {
    const update = enabled
      ? {
          enabled,
          disabledReason: null,
        }
      : { enabled };

    await validateInput(update, updatePrinterEnabledRule);
    await this.get(printerId);

    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateDisabledReason(printerId: MongoIdType, disabledReason: string) {
    const enabled = !disabledReason?.length;
    const update = {
      disabledReason,
      enabled,
    };

    await validateInput(update, updatePrinterDisabledReasonRule);
    await this.get(printerId);

    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  private async validateAndDefault(printer): Promise<Object> {
    const mergedPrinter = {
      ...getDefaultPrinterEntry(),
      enabled: true,
      ...printer,
    };
    if (mergedPrinter.printerURL?.length) {
      mergedPrinter.printerURL = normalizeURLWithProtocol(mergedPrinter.printerURL);
    }
    return await validateInput(mergedPrinter, createMongoPrinterRules);
  }
}
