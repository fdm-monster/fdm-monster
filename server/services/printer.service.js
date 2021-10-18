const Printers = require("../models/Printer");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { sanitizeURL } = require("../utils/url.utils");
const { validateInput } = require("../handlers/validators");
const {
  createPrinterRules,
  updatePrinterEnabledRule
} = require("./validators/printer-service.validators");
const {
  getDefaultPrinterEntry,
  getPowerSettingsDefault
} = require("../constants/service.constants");

class PrinterService {
  /**
   * Lists the printers present in the database.
   */
  async list() {
    return Printers.find({}, null, {
      sort: { sortIndex: 1 }
    });
  }

  async #printerCount() {
    return Printers.countDocuments();
  }

  async get(printerId) {
    const filter = { _id: printerId };
    const printer = await Printers.findOne(filter);

    if (!printer) {
      throw new NotFoundException(
        `The printer ID '${printerId}' is not an existing printer. This is a bug.`
      );
    }

    return printer;
  }

  async delete(printerId) {
    const filter = { _id: printerId };

    return Printers.findOneAndDelete(filter);
  }

  async validateAndDefault(printer) {
    const mergedPrinter = {
      ...getDefaultPrinterEntry(),
      ...printer
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

    // We should not to this now: Regenerate sort index on printer add...
    // await this.reGenerateSortIndex();

    mergedPrinter.dateAdded = Date.now();
    mergedPrinter.sortIndex = await this.#printerCount(); // 0-based index so no +1 needed

    return Printers.create(mergedPrinter);
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

    printer.printerURL = printerURL;
    printer.webSocketURL = webSocketURL;
    printer.apiKey = apiKey;
    if (enabled !== undefined) {
      printer.enabled = enabled;
    }
    printer.settingsAppearance.name = settingsAppearance.name;
    printer.save();

    return printer;
  }

  /**
   *
   * @param printerId
   * @param sortIndex
   * @returns {Promise<Query<Document<any, any> | null, Document<any, any>, {}>>}
   */
  async updateSortIndex(printerId, sortIndex) {
    const filter = { _id: printerId };
    const update = { sortIndex };
    return Printers.findOneAndUpdate(filter, update, {
      returnOriginal: false
    });
  }

  async updateFlowRate(printerId, flowRate) {
    const filter = { _id: printerId };
    const update = { flowRate };
    return Printers.findOneAndUpdate(filter, update, {
      returnOriginal: false
    });
  }

  async updateFeedRate(printerId, feedRate) {
    const filter = { _id: printerId };
    const update = { feedRate };
    return Printers.findOneAndUpdate(filter, update, {
      returnOriginal: false
    });
  }

  async resetPowerSettings(printerId) {
    const filter = { _id: printerId };
    const update = {
      powerSettings: getPowerSettingsDefault()
    };

    return Printers.findOneAndUpdate(filter, update, {
      returnOriginal: false
    });
  }

  async updateConnectionSettings(printerId, { printerURL, camURL, webSocketURL, apiKey }) {
    const update = {
      printerURL: sanitizeURL(printerURL),
      camURL: sanitizeURL(camURL),
      webSocketURL: sanitizeURL(webSocketURL),
      apiKey
    };

    await validateInput(update, createPrinterRules);

    return Printers.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false
    });
  }

  async updateEnabled(printerId, enabled) {
    const update = {
      enabled
    };

    await validateInput(update, updatePrinterEnabledRule);

    return Printers.findByIdAndUpdate(printerId, update, {
      new: true,
      useFindAndModify: false
    });
  }

  async savePrinterAdminUsername(id, opAdminUserName) {
    const printer = Printers.findById(id);
    if (!printer) {
      throw new NotFoundException(`The printer with ID ${id} does not exist in database.`);
    }

    printer.currentUser = opAdminUserName;
    printer.markModified("currentUser");
    await printer.updateOne();
  }
}

module.exports = PrinterService;
