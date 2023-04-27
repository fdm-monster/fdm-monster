const { Printer } = require("../models/Printer");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { sanitizeURL } = require("../utils/url.utils");
const { validateInput } = require("../handlers/validators");
const {
  createPrinterRules,
  updatePrinterEnabledRule,
  updateApiUsernameRule,
  updatePrinterDisabledReasonRule,
} = require("./validators/printer-service.validation");
const { getDefaultPrinterEntry } = require("../constants/service.constants");

class PrinterService {
  /**
   * Lists the printers present in the database.
   */
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

  async delete(printerId) {
    const filter = { _id: printerId };

    return Printer.findOneAndDelete(filter);
  }

  async validateAndDefault(printer) {
    const defaultWebSocketURL = printer.printerURL?.replace("http://", "ws://").replace("https://", "wss://");
    const mergedPrinter = {
      ...getDefaultPrinterEntry(),
      webSocketURL: defaultWebSocketURL,
      enabled: true,
      ...printer,
    };
    return await validateInput(mergedPrinter, createPrinterRules);
  }

  /**
   * Stores a new printer into the database.
   * @param {Object} newPrinter object to create.
   * @throws {Error} If the printer is not correctly provided.
   */
  async create(newPrinter) {
    if (!newPrinter) throw new Error("Missing printer");

    const mergedPrinter = await this.validateAndDefault(newPrinter);
    mergedPrinter.dateAdded = Date.now();
    return Printer.create(mergedPrinter);
  }

  /**
   * Explicit patching of printer document
   * @param printerId
   * @param updateData
   * @returns {Promise<Query<Document<any, any, unknown> | null, Document<any, any, unknown>, {}, unknown>>}
   */
  async update(printerId, updateData) {
    const printer = await this.get(printerId);

    const { printerURL, webSocketURL, apiKey, enabled, settingsAppearance } = await validateInput(updateData, createPrinterRules);

    await this.get(printerId);

    printer.printerURL = printerURL;
    printer.webSocketURL = webSocketURL;
    printer.apiKey = apiKey;
    if (enabled !== undefined) {
      printer.enabled = enabled;
    }
    printer.settingsAppearance.name = settingsAppearance.name;

    await printer.save();

    return printer;
  }

  async updateFlowRate(printerId, flowRate) {
    const update = { flowRate };
    await this.get(printerId);
    return Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }

  async updateFeedRate(printerId, feedRate) {
    const update = { feedRate };
    await this.get(printerId);
    return Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }

  async updateConnectionSettings(printerId, { printerURL, webSocketURL, apiKey }) {
    const update = {
      printerURL: sanitizeURL(printerURL),
      webSocketURL: sanitizeURL(webSocketURL),
      apiKey,
    };

    await validateInput(update, createPrinterRules);
    await this.get(printerId);

    return Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
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

    return Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }

  async updateDisabledReason(printerId, disabledReason) {
    const enabled = !disabledReason?.length;
    const update = {
      disabledReason,
      enabled,
    };

    await validateInput(update, updatePrinterDisabledReasonRule);
    await this.get(printerId);

    return Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }

  async updateApiUsername(printerId, opAdminUserName) {
    const update = {
      currentUser: opAdminUserName,
    };

    await validateInput(update, updateApiUsernameRule);
    await this.get(printerId);

    return Printer.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }
}

module.exports = PrinterService;
