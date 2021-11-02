const _ = require("lodash");
const {
  NotImplementedException,
  ValidationException
} = require("../exceptions/runtime.exceptions");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { validateInput } = require("../handlers/validators");
const { createTestPrinterRules } = require("./validation/create-test-printer.validation");
const ObjectID = require("mongodb").ObjectID;

class PrintersStore {
  #settingsStore;
  #printerTickerStore;
  #printerService;
  #printerStateFactory;
  #eventEmitter2;

  #printerStates;
  #testPrinterState;
  #logger;

  constructor({
    settingsStore,
    printerTickerStore,
    printerStateFactory,
    eventEmitter2,
    printerService,
    loggerFactory
  }) {
    this.#settingsStore = settingsStore;
    this.#printerService = printerService;
    this.#printerTickerStore = printerTickerStore;
    this.#printerStateFactory = printerStateFactory;
    this.#eventEmitter2 = eventEmitter2;
    this.#logger = loggerFactory("Server-PrintersStore");
  }

  _validateState() {
    if (!this.#printerStates) {
      throw new Error(
        "PrintersStore was not loaded. Cant fire printer loading action. Call 'loadPrintersStore' first."
      );
    }
  }

  validateIdList(identifierList) {
    if (!Array.isArray(identifierList)) {
      throw new Error("Input provided was not a valid array of string IDs.");
    }
    const notFoundIDs = [];
    const duplicateIDs = [];
    const uniqueIDs = [];
    identifierList.forEach((id) => {
      const foundPrinter = this.#printerStates.find((p) => p.id === id.toString());
      if (!foundPrinter) {
        notFoundIDs.push(id.toString());
      }
      if (!uniqueIDs.includes(id)) {
        uniqueIDs.push(id);
      } else {
        duplicateIDs.push(id);
      }
    });

    if (notFoundIDs.length > 0) {
      throw new Error(
        `The following provided IDs did not match the printer IDS ${JSON.stringify(notFoundIDs)}`
      );
    }
    if (duplicateIDs.length > 0) {
      throw new Error(
        `The following provided IDs were provided as duplicates ${JSON.stringify(duplicateIDs)}`
      );
    }
  }

  /**
   * Return a mutable copy of all frozen printers states mapped to flat JSON
   * @param {boolean} includeDisconnected printers marked by tearDown (disconnected) are be filtered
   * @param isTest
   */
  listPrintersFlat(includeDisconnected = false) {
    return this.listPrinterStates(includeDisconnected)
      .filter((s) => s.toFlat)
      .map((s) => s.toFlat());
  }

  getTestPrinter() {
    return this.#testPrinterState;
  }

  /**
   * List the prefetched printer states without mapping
   * We check and throw instead of loading proactively: more predictable and not async
   * @returns {*}
   * @param includeDisconnected
   * @param isTest takes complete preference over 'includeDisconnected'
   */
  listPrinterStates(includeDisconnected = false) {
    this._validateState();

    return this.#printerStates.filter((p) => includeDisconnected || p.markForRemoval === false);
  }

  getPrinterCount() {
    return this.listPrinterStates().length;
  }

  getPrinterState(id) {
    this._validateState();
    if (!ObjectID.isValid(id)) {
      // Go for synchronous error
      throw new ValidationException({ printerId: "Printer Id is not a valid Mongo ID" });
    }

    const printerState = this.#printerStates.find((p) => p.id === id);

    if (!printerState) {
      throw new NotFoundException(`The printer ID '${id}' was not found in the PrintersStore.`);
    }

    return printerState;
  }

  getPrinterFlat(id) {
    const state = this.getPrinterState(id);
    return state.toFlat();
  }

  getPrinterLogin(id) {
    const state = this.getPrinterState(id);

    return state.getLoginDetails();
  }

  async updatePrinterConnectionSettings(printerId, { printerURL, camURL, webSocketURL, apiKey }) {
    const printerState = this.getPrinterState(printerId);

    const newDoc = await this.#printerService.updateConnectionSettings(printerId, {
      printerURL,
      camURL,
      webSocketURL,
      apiKey
    });

    printerState.updateEntityData(newDoc, true);

    return newDoc;
  }

  /**
   * Fetch printers from database and setup the state models (destructive action!)
   * @returns {Promise<void>}
   */
  async loadPrintersStore() {
    const printerDocs = await this.#printerService.list();

    this.#printerStates = [];
    for (let printerDoc of printerDocs) {
      try {
        const printerState = await this.#printerStateFactory.create(printerDoc);
        this.#printerStates.push(printerState);
      } catch (e) {
        this.#logger.error("PrinterFactory failed to reconstruct existing Printer State.", e.stack);
      }
    }

    this.#logger.info(`Loaded ${this.#printerStates.length} printer states`);
  }

  async deleteTestPrinter() {
    await this.#testPrinterState.tearDown();

    this.#testPrinterState = undefined;
  }

  async deletePrinter(printerId) {
    this._validateState();

    // Ensure it exists before continuing
    const printerState = this.getPrinterState(printerId);
    const printerEntity = this.#printerService.get(printerId);

    // Mark for removal, remove caches and close websocket stream
    await printerState.tearDown();

    // Remove state
    _.remove(this.#printerStates, (p) => p.id === printerId);

    // Purge from database
    await this.#printerService.delete(printerId);

    return printerEntity;
  }

  async updateSortIndex(identifierList) {
    this.validateIdList(identifierList);

    // TODO generate a backup in case of intermediate failures

    for (let [index, id] of identifierList.entries()) {
      const doc = await this.#printerService.updateSortIndex(id, index);
      let printer = this.getPrinterState(id);
      printer.updateEntityData(doc, false);
    }
  }

  async updateEnabled(printerId, enabled) {
    // Check existence with cache first
    let printer = this.getPrinterState(printerId);

    const doc = await this.#printerService.updateEnabled(printerId, enabled);

    printer.updateEntityData(doc, true);
  }

  /**
   * @deprecated A list used to sort printers. This is obsolete next minor release.
   * @returns {*[]}
   */
  getPrinterSortingList() {
    const sorted = [];
    for (let p = 0; p < this.#printerStates.length; p++) {
      const sort = {
        sortIndex: this.#printerStates[p].sortIndex,
        actualIndex: p
      };
      sorted.push(sort);
    }
    sorted.sort((a, b) => (a.sortIndex > b.sortIndex ? 1 : -1));
    return sorted;
  }

  addLoggedTicker(printer, message, state) {
    this.#logger.info(message);
    this.#printerTickerStore.addIssue(printer, message, state);
  }

  async batchImport(printers) {
    if (!printers?.length) return [];

    this.#logger.info(`Validating ${printers.length} printer objects`);
    for (let printer of printers) {
      await this.#printerService.validateAndDefault(printer);
    }

    this.#logger.info(`Validation passed. Adding ${printers.length} printers`);

    // We've passed validation completely - creation will likely succeed
    const states = [];
    for (let printer of printers) {
      const newState = await this.addPrinter(printer);
      states.push(newState.toFlat());
    }

    this.#logger.info(`Creation succeeded. Added ${printers.length} printers`);
    return states;
  }

  async addPrinter(printer) {
    this._validateState();

    const newPrinterDoc = await this.#printerService.create(printer);
    this.#logger.info(
      `Saved new Printer: ${newPrinterDoc.printerURL} with ID ${newPrinterDoc._id}`
    );

    const newPrinterState = await this.#printerStateFactory.create(newPrinterDoc);
    this.#printerStates.push(newPrinterState);

    // The next 'round' will involve setting up a websocket for this printer
    return newPrinterState;
  }

  /**
   * Update properties available to 'addPrinter'
   * @param printerId
   * @param printer
   * @returns {Promise<*>}
   */
  async updatePrinter(printerId, printer) {
    this._validateState();

    const updatedDoc = await this.#printerService.update(printerId, printer);
    this.#logger.info(`Updated Printer: ${updatedDoc.printerURL} with ID ${updatedDoc._id}`);

    const updatedPrinterState = await this.getPrinterState(printerId);
    updatedPrinterState.updateEntityData(updatedDoc, true);

    // The next 'round' will involve setting up a websocket for this printer
    return updatedPrinterState.toFlat();
  }

  /**
   * Sets up/recreates a printer to be tested quickly by running the standard checks
   * @param printer
   * @returns {Promise<*>}
   */
  async setupTestPrinter(printer) {
    const validatedData = await validateInput(printer, createTestPrinterRules);
    validatedData.enabled = true;

    const newPrinterDoc = { _doc: validatedData };
    this.#logger.info(
      `Stored test Printer: ${validatedData.printerURL} with ID ${validatedData.correlationToken}`
    );

    const newPrinterState = await this.#printerStateFactory.create(newPrinterDoc, true);
    if (this.#testPrinterState) {
      await this.deleteTestPrinter();
    }

    this.#testPrinterState = newPrinterState;

    return this.#testPrinterState;
  }

  /**
   * Reconnect the OctoPrint Websocket connection
   * @param id
   * @param lazy (Not implemented yet, default: true)
   */
  reconnectOctoPrint(id, lazy = true) {
    if (!lazy) {
      // TODO eager reconnect
      throw new NotImplementedException(
        "Eager (lazy==true) reconnect OctoPrint mode is not implemented yet."
      );
    }
    const printer = this.getPrinterState(id);
    printer.resetConnectionState();
  }

  getOctoPrintVersions() {
    if (!this.#printerStates) return [];

    return this.#printerStates.map((printer) => printer.getOctoPrintVersion());
  }

  setPrinterStepSize(id, stepSize) {
    // Will be abstracted in future in order to fit different types of printers
    const printer = this.getPrinterState(id);

    printer.updateStepSize(stepSize);
  }

  async setPrinterFeedRate(id, feedRate) {
    const printerState = this.getPrinterState(id);

    const doc = await this.#printerService.updateFeedRate(id, feedRate);

    printerState.updateEntityData(doc, false);
  }

  async setPrinterFlowRate(id, flowRate) {
    const printerState = this.getPrinterState(id);

    const doc = await this.#printerService.updateFlowRate(id, flowRate);

    printerState.updateEntityData(doc, false);
  }

  async resetPrinterPowerSettings(id) {
    const printerState = this.getPrinterState(id);

    const doc = await this.#printerService.resetPowerSettings(id);

    printerState.updateEntityData(doc, false);

    return doc.powerSettings;
  }
}

module.exports = PrintersStore;
