const PrinterModel = require("../models/Printer");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { sanitizeURL } = require("../utils/url.utils");
const { validateInput } = require("../handlers/validators");
const {
  createPrinterRules,
  updatePrinterEnabledRule,
  updateApiUsernameRule,
} = require("./validators/printer-service.validation");
const { getDefaultPrinterEntry } = require("../constants/service.constants");
const {
  updatePrinterDisabledReasonRules,
} = require("../controllers/validation/printer-controller.validation");

class PrinterService {
  /**
   * Lists the printers present in the database.
   */
  async list() {
    return PrinterModel.find({}, null, {
      sort: { sortIndex: 1 },
    });
  }

  async #printerCount() {
    return PrinterModel.countDocuments();
  }

  async get(printerId) {
    const filter = { _id: printerId };
    const printer = await PrinterModel.findOne(filter);

    if (!printer) {
      throw new NotFoundException(`The printer ID '${printerId}' is not an existing printer.`);
    }

    return printer;
  }

  async delete(printerId) {
    const filter = { _id: printerId };

    return PrinterModel.findOneAndDelete(filter);
  }

  async validateAndDefault(printer) {
    const mergedPrinter = {
      ...getDefaultPrinterEntry(),
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
    mergedPrinter.sortIndex = await this.#printerCount(); // 0-based index so no +1 needed

    return PrinterModel.create(mergedPrinter);
  }

  /**
   * Explicit patching of printer document
   * @param printerId
   * @param updateData
   * @returns {Promise<Query<Document<any, any, unknown> | null, Document<any, any, unknown>, {}, unknown>>}
   */
  async update(printerId, updateData) {
    const printer = await this.get(printerId);

    const { printerURL, webSocketURL, apiKey, enabled, settingsAppearance } = await validateInput(
      updateData,
      createPrinterRules
    );

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

  /**
   *
   * @param printerId
   * @param sortIndex
   * @returns {Promise<Query<Document<any, any> | null, Document<any, any>, {}>>}
   */
  async updateSortIndex(printerId, sortIndex) {
    const update = { sortIndex };
    await this.get(printerId);
    return PrinterModel.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }

  async updateFlowRate(printerId, flowRate) {
    const update = { flowRate };
    await this.get(printerId);
    return PrinterModel.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }

  async updateFeedRate(printerId, feedRate) {
    const update = { feedRate };
    await this.get(printerId);
    return PrinterModel.findByIdAndUpdate(printerId, update, {
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

    return PrinterModel.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }

  async updateEnabled(printerId, enabled) {
    const update = {
      enabled,
    };

    await validateInput(update, updatePrinterEnabledRule);
    await this.get(printerId);

    return PrinterModel.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }

  async updateDisabledReason(printerId, disabledReason) {
    const update = {
      disabledReason,
    };

    await validateInput(update, update);
    await this.get(printerId);

    return PrinterModel.findByIdAndUpdate(printerId, update, {
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

    return PrinterModel.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false,
    });
  }
}

module.exports = PrinterService;
