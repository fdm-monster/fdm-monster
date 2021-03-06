const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { validateMiddleware, getScopedPrinter } = require("../handlers/validators");
const {
  updateSortIndexRules,
  updatePrinterConnectionSettingRules,
  stepSizeRules,
  flowRateRules,
  feedRateRules,
  updatePrinterEnabledRule,
  testPrinterApiRules
} = require("./validation/printer-controller.validation");
const { AppConstants } = require("../server.constants");
const { convertHttpUrlToWebsocket } = require("../utils/url.utils");
const DITokens = require("../container.tokens");
const { Status, getSettingsAppearanceDefault } = require("../constants/service.constants");
const { printerResolveMiddleware } = require("../middleware/printer");
const { generateCorrelationToken } = require("../utils/correlation-token.util");
const { ROLES } = require("../constants/authorization.constants");

class PrinterController {
  #printersStore;
  #jobsCache;
  #taskManagerService;
  #terminalLogsCache;
  #octoPrintApiService;
  #pluginRepositoryCache;
  #fileCache;
  #sseHandler;
  #sseTask;

  #logger;

  constructor({
    printersStore,
    terminalLogsCache,
    printerSseHandler,
    taskManagerService,
    printerSseTask,
    loggerFactory,
    octoPrintApiService,
    pluginRepositoryCache,
    jobsCache,
    fileCache
  }) {
    this.#logger = loggerFactory("Server-API");

    this.#printersStore = printersStore;
    this.#jobsCache = jobsCache;
    this.#terminalLogsCache = terminalLogsCache;
    this.#taskManagerService = taskManagerService;
    this.#octoPrintApiService = octoPrintApiService;
    this.#pluginRepositoryCache = pluginRepositoryCache;
    this.#fileCache = fileCache;
    this.#sseHandler = printerSseHandler;
    this.#sseTask = printerSseTask;
  }

  async sse(req, res) {
    this.#sseHandler.handleRequest(req, res);
    await this.#sseTask.run();
  }

  async getPrinter(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const foundPrinter = this.#printersStore.getPrinterFlat(currentPrinterId);
    res.send(foundPrinter);
  }

  async getPrinterLoginDetails(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    res.send(printerLogin);
  }

  async sendSerialConnectCommand(req, res) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.#octoPrintApiService.connectCommand;
    await this.#octoPrintApiService.sendConnectionCommand(printerLogin, command);

    res.send(Status.success("Connect command sent"));
  }

  async sendSerialDisconnectCommand(req, res) {
    const { printerLogin } = getScopedPrinter(req);

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
    const { printerLogin } = getScopedPrinter(req);

    const command = this.#octoPrintApiService.cancelJobCommand;
    await this.#octoPrintApiService.sendJobCommand(printerLogin, command);

    res.send(Status.success("Cancel command sent"));
  }

  async testConnection(req, res) {
    const newPrinter = await validateMiddleware(req, testPrinterApiRules);

    if (!newPrinter.webSocketURL) {
      newPrinter.webSocketURL = convertHttpUrlToWebsocket(newPrinter.printerURL);
    }

    // As we dont generate a _id we generate a correlation token
    newPrinter.correlationToken = generateCorrelationToken();

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
    printer.settingsAppearance = getSettingsAppearanceDefault();
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
    const { currentPrinterId } = getScopedPrinter(req);
    const result = await this.#printersStore.deletePrinter(currentPrinterId);
    res.send(result);
  }

  /**
   * Update the printer entity, does not adjust everything
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async update(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    let updatedPrinter = req.body;
    updatedPrinter = this.#adjustPrinterObject(updatedPrinter);

    const result = await this.#printersStore.updatePrinter(currentPrinterId, updatedPrinter);

    res.send(result);
  }

  /**
   * Update the printer network connection settings like URL or apiKey - nothing else
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async updateConnectionSettings(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const inputData = await validateMiddleware(req, updatePrinterConnectionSettingRules);

    const newEntity = await this.#printersStore.updatePrinterConnectionSettings(
      currentPrinterId,
      inputData
    );

    res.send({
      printerURL: newEntity.printerURL,
      camURL: newEntity.camURL,
      apiKey: newEntity.apiKey,
      webSocketURL: newEntity.webSocketURL
    });
  }

  async updateSortIndex(req, res) {
    const data = await validateMiddleware(req, updateSortIndexRules);

    this.#logger.info("Sorting printers according to provided order", JSON.stringify(data));
    await this.#printersStore.updateSortIndex(data.sortList);

    // TODO return array with printerID ordering
    res.send({});
  }

  async updateEnabled(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterEnabledRule);

    this.#logger.info("Changing printer enabled setting", JSON.stringify(data));
    await this.#printersStore.updateEnabled(currentPrinterId, data.enabled);

    res.send();
  }

  async reconnectOctoPrint(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);

    this.#logger.info("Refreshing OctoPrint API connection", currentPrinterId);
    this.#printersStore.reconnectOctoPrint(currentPrinterId);

    res.send();
  }

  async setStepSize(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, stepSizeRules);

    this.#printersStore.setPrinterStepSize(currentPrinterId, data.stepSize);
    res.send();
  }

  async setFeedRate(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, feedRateRules);

    await this.#printersStore.setPrinterFeedRate(currentPrinterId, data.feedRate);
    res.send();
  }

  async setFlowRate(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, flowRateRules);

    await this.#printersStore.setPrinterFlowRate(currentPrinterId, data.flowRate);
    res.send();
  }

  async resetPowerSettings(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);

    const defaultPowerSettings = await this.#printersStore.resetPrinterPowerSettings(
      currentPrinterId
    );

    res.send({ powerSettings: defaultPowerSettings });
  }

  async getTerminalLogs(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    this.#logger.info("Querying terminal logs for: ", currentPrinterId);
    let terminalLogs = this.#terminalLogsCache.getPrinterTerminalLogs(currentPrinterId);
    res.send(terminalLogs);
  }

  /**
   * This list should move to generic controller
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async getPluginList(req, res) {
    let pluginList = await this.#pluginRepositoryCache.getCache();
    res.send(pluginList);
  }

  /**
   * List installed plugins (OP 1.6.0+)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async getPrinterPluginList(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    let pluginList = await this.#octoPrintApiService.getPluginManagerPlugins(printerLogin);
    res.send(pluginList);
  }
}

// prettier-ignore
module.exports = createController(PrinterController)
    .prefix(AppConstants.apiRoute + "/printer")
    .before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN]), printerResolveMiddleware()])
    .get("/", "list")
    .get("/sse", "sse")
    .post("/", "create")
    .post("/batch", "importBatch")
    .post("/test-connection", "testConnection")
    .post("/sort-index", "updateSortIndex")
    .get("/plugin-list", "getPluginList")
    .get("/:id", "getPrinter")
    .patch("/:id", "update")
    .delete("/:id", "delete")
    .get("/:id/login-details", "getPrinterLoginDetails")
    .post("/:id/serial-connect", "sendSerialConnectCommand")
    .post("/:id/serial-disconnect", "sendSerialDisconnectCommand")
    .post("/:id/job/stop", "stopPrintJob")
    .post("/:id/reconnect", "reconnectOctoPrint")
    .patch("/:id/enabled", "updateEnabled")
    .patch("/:id/connection", "updateConnectionSettings")
    .patch("/:id/step-size", "setStepSize")
    .patch("/:id/flow-rate", "setFlowRate")
    .patch("/:id/feed-rate", "setFeedRate")
    .patch("/:id/reset-power-settings", "resetPowerSettings")
    .get("/:id/terminal-logs", "getTerminalLogs")
    .get("/:id/plugin-list", "getPrinterPluginList");
