const { KeyDiffCache } = require("../utils/cache/key-diff.cache");
const { printerEvents } = require("../constants/event.constants");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { map } = require("../utils/mapper.utils");

// Generate the JSDoc typedef for Printer model
/**
 * @typedef {Object} CachedPrinter
 * @property {string} id - The id of the printer. (required)
 * @property {string} apiKey - The API key of the printer. (required)
 * @property {string} printerURL - The URL of the printer. (required)
 * @property {boolean} enabled - Indicates if the printer is enabled. (default: true)
 * @property {string} disabledReason - The reason for disabling the printer.
 * @property {string} printerName - The name setting of the printer.
 * @property {string} currentUser - The current user of the printer.
 * @property {number} dateAdded - The date when the printer was added.
 * @property {Object} lastPrintedFile - The details of the last printed file (deprecated).
 * @property {string} lastPrintedFile.fileName - The name of the last printed file.
 * @property {number} lastPrintedFile.editTimestamp - The timestamp when the last printed file was edited.
 * @property {string} lastPrintedFile.parsedColor - The parsed color of the last printed file.
 * @property {number} lastPrintedFile.parsedVisualizationRAL - The parsed visualizationRAL of the last printed file.
 * @property {number} lastPrintedFile.parsedAmount - The parsed amount of the last printed file.
 * @property {string} lastPrintedFile.parsedMaterial - The parsed material of the last printed file.
 * @property {string} lastPrintedFile.parsedOrderCode - The parsed order code of the last printed file.
 * @property {Object} fileList - The list of files in the printer.
 * @property {Array} fileList.files - The array of files in the printer.
 * @property {Array} fileList.folders - The array of folders in the printer.
 * @property {number} fileList.free - The free space available in the printer.
 * @property {number} fileList.total - The total space available in the printer.
 * @property {number} feedRate - The feed rate of the printer.
 * @property {number} flowRate - The flow rate of the printer.
 */

class PrinterCache extends KeyDiffCache {
  /**
   * @type {PrinterService}
   */
  printerService;

  constructor({ printerService, eventEmitter2 }) {
    super();
    this.printerService = printerService;
    this.eventEmitter2 = eventEmitter2;

    this.eventEmitter2.on(printerEvents.batchPrinterCreated, this.handleBatchPrinterCreated.bind(this));
    this.eventEmitter2.on(printerEvents.printerCreated, this.handlePrinterCreatedOrUpdated.bind(this));
    this.eventEmitter2.on(printerEvents.printerUpdated, this.handlePrinterCreatedOrUpdated.bind(this));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
  }

  /**
   * @returns {Promise<Printer>} semi-alike printer model
   */
  async loadCache() {
    const printerDocs = await this.printerService.list();
    const dtos = this.mapArray(printerDocs);
    await this.setValuesBatch(dtos, true);
    return dtos;
  }

  /**
   * @private
   */
  mapArray(printerDocs) {
    return printerDocs.map((p) => {
      return this.map(p);
    });
  }

  /**
   *
   * @param printerDoc
   * @returns {CachedPrinter}
   */
  map(printerDoc) {
    const p = map(printerDoc);
    p.printerName = p.settingsAppearance.name;
    delete p.settingsAppearance;
    return p;
  }

  /**
   * @returns {Promise<Printer[]>}
   */
  async listCachedPrinters(includeDisabled = false) {
    const printers = await this.getAllValues();
    if (!includeDisabled) {
      return printers.filter((p) => p.enabled);
    }
    return printers;
  }

  /**
   *
   * @param {string} id
   * @returns {?Printer}
   */
  getCachedPrinter(id) {
    const printer = this.printers.find((printer) => printer.id === id);
    if (!printer) {
      throw new NotFoundException(`Printer with id ${id} not found`);
    }
    return printer;
  }

  getName(id) {
    const printer = this.getCachedPrinter(id);
    return printer.name;
  }

  getLoginDto(id) {
    const printer = this.getCachedPrinter(id);
    return {
      printerURL: printer.printerURL,
      apiKey: printer.apiKey,
    };
  }

  handleBatchPrinterCreated({ printers }) {
    const mappedPrinters = this.mapArray(printers);
    this.printers = [...this.printers, ...mappedPrinters];
    this.batchMarkUpdated(mappedPrinters);
  }

  handlePrinterCreatedOrUpdated({ printer }) {
    const printerDto = this.map(printer);
    if (this.printers.find((p) => p.id === printer.id)) {
      this.printers = this.printers.map((p) => (p.id.toString() === printerDto.id ? printerDto : p));
    } else {
      this.printers = [...this.printers, printerDto];
    }
    this.markUpdated(printerDto.id.toString());
  }

  handlePrintersDeleted({ printerIds }) {
    this.printers = this.printers.filter((p) => !printerIds.includes(p.id.toString()));
    this.batchMarkDeleted(printerIds.map((id) => id.toString()));
  }

  getId(value) {
    return value.id.toString();
  }
}

module.exports = {
  PrinterCache,
};
