import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { printerEvents } from "@/constants/event.constants";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { map } from "@/utils/mapper.utils";
import { PrinterService } from "@/services/printer.service";
import EventEmitter2 from "eventemitter2";

// Generate the JSDoc typedef for Printer model
/**
 * @typedef {Object} CachedPrinter
 * @property {string} id - The id of the printer. (required)
 * @property {string} apiKey - The API key of the printer. (required)
 * @property {string} printerURL - The URL of the printer. (required)
 * @property {boolean} enabled - Indicates if the printer is enabled. (default: true)
 * @property {string} disabledReason - The reason for disabling the printer.
 * @property {string} printerName - The name setting of the printer.
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

export class PrinterCache extends KeyDiffCache {
  printerService: PrinterService;
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;

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
    const keyValues = dtos.map((p) => ({ key: this.getId(p), value: p }));
    await this.setKeyValuesBatch(keyValues, true);
    return dtos;
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
   * @returns {Promise<?Printer>}
   */
  async getCachedPrinterOrThrowAsync(id) {
    const printer = await this.getValue(id);
    if (!printer) {
      throw new NotFoundException(`Printer with id ${id} not found`);
    }
    return printer;
  }

  getCachedPrinterOrThrow(id) {
    const printer = this.keyValueStore[id];
    if (!printer) {
      throw new NotFoundException(`Printer with id ${id} not found`);
    }
    return printer;
  }

  async getNameAsync(id) {
    const printer = await this.getCachedPrinterOrThrowAsync(id);
    return printer.name;
  }

  getName(id) {
    const printer = this.getCachedPrinterOrThrow(id);
    return printer.name;
  }

  async getLoginDtoAsync(id) {
    const printer = await this.getCachedPrinterOrThrowAsync(id);
    return {
      printerURL: printer.printerURL,
      apiKey: printer.apiKey,
    };
  }

  getLoginDto(id) {
    const printer = this.getCachedPrinterOrThrow(id);
    return {
      printerURL: printer.printerURL,
      apiKey: printer.apiKey,
    };
  }

  async handleBatchPrinterCreated({ printers }) {
    const mappedPrinters = this.mapArray(printers);
    const keyValues = mappedPrinters.map((p) => ({ key: this.getId(p), value: p }));
    await this.setKeyValuesBatch(keyValues, true);
  }

  async handlePrinterCreatedOrUpdated({ printer }) {
    const printerDto = this.map(printer);
    await this.setKeyValue(printerDto.id, printerDto, true);
  }

  async handlePrintersDeleted({ printerIds }) {
    await this.deleteKeysBatch(printerIds, true);
  }

  /**
   * @private
   */
  getId(value) {
    return value.id.toString();
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
   * @private
   * @param printerDoc
   * @returns {CachedPrinter}
   */
  map(printerDoc) {
    const p = map(printerDoc);
    p.printerName = p.settingsAppearance.name;
    delete p.settingsAppearance;
    delete p.fileList;
    return p;
  }
}
