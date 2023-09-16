const { Printer } = require("../models/Printer");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { validateInput } = require("../handlers/validators");
const {
  createPrinterRules,
  updatePrinterEnabledRule,
  updateApiUsernameRule,
  updatePrinterDisabledReasonRule,
} = require("./validators/printer-service.validation");
const { getDefaultPrinterEntry } = require("../constants/service.constants");
const { printerEvents } = require("../constants/event.constants");
const { normalizeUrl } = require("../utils/normalize-url");

class PrinterService {
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;
  /**
   * @type {LoggerService}
   */
  logger;

  constructor({ eventEmitter2, loggerFactory }) {
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory("PrinterService");
  }

  async list() {
    return Printer.find({}, null, {
      sort: { dateAdded: 1 },
    });
  }

  async get(printerId) {
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
  async update(printerId, updateData) {
    const printer = await this.get(printerId);

    updateData.printerURL = PrinterService.normalizeURLWithProtocol(updateData.printerURL);
    const { printerURL, apiKey, enabled, settingsAppearance } = await validateInput(updateData, createPrinterRules);
    await this.get(printerId);

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

  async deleteMany(printerIds, emitEvent = true) {
    await Printer.deleteMany({ _id: { $in: printerIds } });
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds });
    }
  }

  /**
   *
   * @param {string} printerId
   * @param {boolean} emitEvent
   * @returns {Promise<Printer>}
   */
  async delete(printerId, emitEvent = true) {
    const filter = { _id: printerId };

    const result = await Printer.findOneAndDelete(filter);
    if (emitEvent) {
      this.eventEmitter2.emit(printerEvents.printersDeleted, { printerIds: [printerId] });
    }
    return result;
  }

  async batchImport(printers) {
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

  async updateLastPrintedFile(printerId, lastPrintedFile) {
    const update = { lastPrintedFile };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateLastPrintedFile(printerId, lastPrintedFile) {
    const update = { lastPrintedFile };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    return printer;
  }

  async updateFlowRate(printerId, flowRate) {
    const update = { flowRate };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateFeedRate(printerId, feedRate) {
    const update = { feedRate };
    await this.get(printerId);
    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateConnectionSettings(printerId, { printerURL, apiKey }) {
    const update = {
      printerURL: PrinterService.normalizeURLWithProtocol(printerURL),
      apiKey,
    };

    await validateInput(update, createPrinterRules);
    await this.get(printerId);

    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  async updateEnabled(printerId, enabled) {
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

  async updateDisabledReason(printerId, disabledReason) {
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

  async updateApiUsername(printerId, opAdminUserName) {
    const update = {
      currentUser: opAdminUserName,
    };

    await validateInput(update, updateApiUsernameRule);
    await this.get(printerId);

    const printer = await Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
    this.eventEmitter2.emit(printerEvents.printerUpdated, { printer });
    return printer;
  }

  /**
   * @private
   * @param printer
   * @returns {Promise<Object>}
   */
  async validateAndDefault(printer) {
    const mergedPrinter = {
      ...getDefaultPrinterEntry(),
      enabled: true,
      ...printer,
    };
    if (mergedPrinter.printerURL?.length) {
      mergedPrinter.printerURL = PrinterService.normalizeURLWithProtocol(mergedPrinter.printerURL);
    }
    return await validateInput(mergedPrinter, createPrinterRules);
  }

  static normalizeURLWithProtocol(printerURL) {
    if (!printerURL.startsWith("http://") && !printerURL.startsWith("https://")) {
      printerURL = `http://${printerURL}`;
    }

    return normalizeUrl(printerURL);
  }
}

module.exports = PrinterService;
