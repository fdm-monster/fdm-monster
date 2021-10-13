const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const { validateMiddleware, validateInput } = require("../handlers/validators");
const {
  updateSortIndexRules,
  updatePrinterConnectionSettingRules,
  stepSizeRules,
  flowRateRules,
  feedRateRules,
  updatePrinterEnabledRule
} = require("./validation/printer-controller.validation");
const { AppConstants } = require("../app.constants");
const { convertHttpUrlToWebsocket } = require("../utils/url.utils");
const { idRules } = require("./validation/generic.validation");
const DITokens = require("../container.tokens");
const { Status, getSettingsApperearanceDefault } = require("../constants/service.constants");

class PrinterController {
  #printersStore;
  #jobsCache;
  #taskManagerService;
  #connectionLogsCache;
  #octoPrintApiService;
  #fileCache;
  #sseHandler;
  #sseTask;

  #logger;

  constructor({
    printersStore,
    connectionLogsCache,
    printerSseHandler,
    taskManagerService,
    printerSseTask,
    loggerFactory,
    octoPrintApiService,
    jobsCache,
    fileCache
  }) {
    this.#logger = loggerFactory("Server-API");

    this.#printersStore = printersStore;
    this.#jobsCache = jobsCache;
    this.#connectionLogsCache = connectionLogsCache;
    this.#taskManagerService = taskManagerService;
    this.#octoPrintApiService = octoPrintApiService;
    this.#fileCache = fileCache;
    this.#sseHandler = printerSseHandler;
    this.#sseTask = printerSseTask;
  }

  async sse(req, res) {
    this.#sseHandler.handleRequest(req, res);
    await this.#sseTask.run();
  }

  /**
   * Previous printerInfo action (not a list function)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async get(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const foundPrinter = this.#printersStore.getPrinterFlat(printerId);

    res.send(foundPrinter);
  }

  async sendSerialConnectCommand(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const command = this.#octoPrintApiService.connectCommand;
    await this.#octoPrintApiService.sendConnectionCommand(printerLogin, command);

    res.send(Status.success("Connect command sent"));
  }

  async sendSerialDisconnectCommand(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const command = this.#octoPrintApiService.disconnectCommand;
    await this.#octoPrintApiService.sendConnectionCommand(printerLogin, command);

    res.send(Status.success("Disconnect command sent"));
  }

  /**
   * Cancels the current job irrespective of file
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async stopPrintJob(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const command = this.#octoPrintApiService.cancelJobCommand;
    await this.#octoPrintApiService.sendJobCommand(printerLogin, command);

    res.send(Status.success("Cancel command sent"));
  }

  async testConnection(req, res) {
    const newPrinter = req.body;
    if (!newPrinter.webSocketURL) {
      newPrinter.webSocketURL = convertHttpUrlToWebsocket(newPrinter.printerURL);
    }

    // As we dont generate a _id we generate a correlation token
    newPrinter.correlationToken = Math.random().toString(36).slice(2);

    this.#logger.info(`Testing printer with correlation token ${newPrinter.correlationToken}`);

    // Add printer with test=true
    const printerState = await this.#printersStore.setupTestPrinter(newPrinter);

    this.#taskManagerService.scheduleDisabledJob(DITokens.printerTestTask);
    res.send(printerState.toFlat());
  }

  #adjustPrinterObject(printer) {
    if (!printer.webSocketURL) {
      printer.webSocketURL = convertHttpUrlToWebsocket(printer.printerURL);
    }
    printer.settingsAppearance = getSettingsApperearanceDefault();
    if (printer.printerName) {
      printer.settingsAppearance.name = printer.printerName;
      delete printer.printerName;
    }

    return printer;
  }

  async create(req, res) {
    let newPrinter = req.body;
    newPrinter = this.#adjustPrinterObject(newPrinter);

    // Has internal validation, but might add some here above as well
    const printerState = await this.#printersStore.addPrinter(newPrinter);

    this.#logger.info(
      `Created printer with ID ${printerState.id || printerState.correlationToken}`
    );

    res.send(printerState.toFlat());
  }

  async importBatch(req, res) {
    const flattenedPrinters = await this.#printersStore.batchImport(req.body);

    res.send(flattenedPrinters);
  }

  async list(req, res) {
    const listedPrinters = this.#printersStore.listPrintersFlat();

    res.send(listedPrinters);
  }

  async delete(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    this.#logger.info("Deleting printer with id", printerId);

    const result = await this.#printersStore.deletePrinter(printerId);

    res.send(result);
  }

  /**
   * Update the 3DPF printer entity, does not adjust everything
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async update(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    let updatedPrinter = req.body;
    updatedPrinter = this.#adjustPrinterObject(updatedPrinter);

    const result = await this.#printersStore.updatePrinter(printerId, updatedPrinter);

    res.send(result);
  }

  /**
   * Update the printer network connection settings like URL or apiKey - nothing else
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async updateConnectionSettings(req, res) {
    const { printer } = await validateMiddleware(req, updatePrinterConnectionSettingRules, res);
    const printerId = printer.id;

    const newEntity = await this.#printersStore.updatePrinterConnectionSettings(printerId, printer);

    res.send({
      printerURL: newEntity.printerURL,
      camURL: newEntity.camURL,
      apiKey: newEntity.apiKey,
      webSocketURL: newEntity.webSocketURL
    });
  }

  async updateSortIndex(req, res) {
    const data = await validateMiddleware(req, updateSortIndexRules, res);

    this.#logger.info("Sorting printers according to provided order", JSON.stringify(data));

    await this.#printersStore.updateSortIndex(data.sortList);

    // TODO return array with printerID ordering
    res.send({});
  }

  async updateEnabled(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const data = await validateMiddleware(req, updatePrinterEnabledRule, res);

    this.#logger.info("Changing printer enabled setting", JSON.stringify(data));

    await this.#printersStore.updateEnabled(printerId, data.enabled);
    res.send({});
  }

  async reconnectOctoPrint(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    this.#logger.info("Reconnecting OctoPrint API connection", printerId);
    this.#printersStore.reconnectOctoPrint(printerId, true);

    res.send({ success: true, message: "Printer will reconnect soon" });
  }

  async setStepSize(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const data = await validateMiddleware(req, stepSizeRules, res);

    this.#printersStore.setPrinterStepSize(printerId, data.stepSize);
    res.send();
  }

  async setFeedRate(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const data = await validateMiddleware(req, feedRateRules, res);

    await this.#printersStore.setPrinterFeedRate(printerId, data.feedRate);
    res.send();
  }

  async setFlowRate(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const data = await validateMiddleware(req, flowRateRules, res);

    await this.#printersStore.setPrinterFlowRate(printerId, data.flowRate);
    res.send();
  }

  async resetPowerSettings(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const defaultPowerSettings = await this.#printersStore.resetPrinterPowerSettings(printerId);

    res.send({ powerSettings: defaultPowerSettings });
  }

  /**
   * WIP quite slow (100ms+) - compatible to /updatePrinterSettings
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async querySettings(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerState = this.#printersStore.getPrinterState(printerId);
    const printerLogin = printerState.getLoginDetails();

    // TODO We dont process these yet
    const octoPrintConnection = await this.#octoPrintApiService.getConnection(printerLogin);
    const octoPrintSettings = await this.#octoPrintApiService.getSettings(printerLogin);
    const octoPrintSystemInfo = await this.#octoPrintApiService.getSystemInfo(printerLogin);
    // await Runner.getLatestOctoPrintSettingsValues(id);

    res.send({ printerInformation: printerState.toFlat() });
  }

  // TODO === The big todo line ===
  async getConnectionLogs(req, res) {
    const params = await validateInput(req.params, idRules);

    const printerId = params.id;
    this.#logger.info("Grabbing connection logs for: ", printerId);
    let connectionLogs = this.#connectionLogsCache.getPrinterConnectionLogs(printerId);

    res.send(connectionLogs);
  }

  async getPluginList(req, res) {
    const params = await validateInput(req.params, idRules);

    this.#logger.info("Grabbing plugin list for: ", params.id);

    const printerState = this.#printersStore.getPrinterState(params.id);
    const printerLogin = printerState.getLoginDetails();

    let pluginList = await this.#octoPrintApiService.getPluginManager(printerLogin, false);
    res.send(pluginList);
  }
}

// prettier-ignore
module.exports = createController(PrinterController)
    .prefix(AppConstants.apiRoute + "/printer")
    .before([ensureAuthenticated])
    .get("/", "list")
    .get("/sse", "sse")
    .post("/", "create")
    .post("/batch", "importBatch")
    .post("/test-connection", "testConnection")
    .post("/sort-index", "updateSortIndex")
    .get("/:id", "get")
    .patch("/:id", "update")
    .delete("/:id", "delete")
    .post("/:id/serial-connect", "sendSerialConnectCommand")
    .post("/:id/serial-disconnect", "sendSerialDisconnectCommand")
    .post("/:id/job/stop", "stopPrintJob")
    .patch("/:id/enabled", "updateEnabled")
    .put("/:id/reconnect", "reconnectOctoPrint")
    .patch("/:id/connection", "updateConnectionSettings")
    .patch("/:id/step-size", "setStepSize")
    .patch("/:id/flow-rate", "setFlowRate")
    .patch("/:id/feed-rate", "setFeedRate")
    .patch("/:id/reset-power-settings", "resetPowerSettings")
    // WIP line
    .post("/:id/query-settings", "querySettings")
    .get("/:id/connection-logs/", "getConnectionLogs")
    .get("/:id/plugin-list", "getPluginList");
