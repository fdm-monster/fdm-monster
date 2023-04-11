const _ = require("lodash");
const { ValidationException } = require("../exceptions/runtime.exceptions");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { validateInput } = require("../handlers/validators");
const { createTestPrinterRules } = require("./validation/create-test-printer.validation");
const { ObjectId } = require("mongodb");

class PrintersStore {
  #printerService;
  #printerStateFactory;
  #eventEmitter2;

  #printerStates;
  #testPrinterState;
  #logger;

  constructor({ printerStateFactory, eventEmitter2, printerService, loggerFactory }) {
    this.#printerService = printerService;
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
   */
  listPrinterStates(includeDisconnected = false) {
    this._validateState();

    return this.#printerStates.filter((p) => includeDisconnected || p.markForRemoval === false);
  }

  getPrinterState(id) {
    this._validateState();
    if (!ObjectId.isValid(id)) {
      // Go for synchronous error
      throw new ValidationException({ printerId: `Printer Id '${id}' is not a valid Mongo ID` });
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

  async updatePrinterConnectionSettings(printerId, { printerURL, webSocketURL, apiKey }) {
    const printerState = this.getPrinterState(printerId);

    const newDoc = await this.#printerService.updateConnectionSettings(printerId, {
      printerURL,
      webSocketURL,
      apiKey,
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
    if (!this.#testPrinterState) return;

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

  async updateApiUserName(printerId, username) {
    let printer = this.getPrinterState(printerId);
    if (!username?.length) throw new ValidationException([{ error: "Username must be non-empty" }]);

    const doc = await this.#printerService.updateApiUsername(printer.id, username);
    printer.updateEntityData(doc);
    return printer.toFlat();
  }

  async updateEnabled(printerId, enabled) {
    let printer = this.getPrinterState(printerId);

    const doc = await this.#printerService.updateEnabled(printerId, enabled);

    printer.updateEntityData(doc, true);
  }

  async updateDisabledReason(printerId, disabledReason) {
    let printer = this.getPrinterState(printerId);
    const doc = await this.#printerService.updateDisabledReason(printerId, disabledReason);

    printer.updateEntityData(doc, true);
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
   */
  reconnectOctoPrint(id) {
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
}

module.exports = PrintersStore;
