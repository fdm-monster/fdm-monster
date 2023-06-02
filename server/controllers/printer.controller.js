const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { validateMiddleware, getScopedPrinter } = require("../handlers/validators");
const {
  updatePrinterConnectionSettingRules,
  flowRateRules,
  feedRateRules,
  updatePrinterEnabledRule,
  testPrinterApiRules,
  updatePrinterDisabledReasonRules,
} = require("./validation/printer-controller.validation");
const { AppConstants } = require("../server.constants");
const { convertHttpUrlToWebsocket, httpToWsUrl } = require("../utils/url.utils");
const DITokens = require("../container.tokens");
const { getSettingsAppearanceDefault } = require("../constants/service.constants");
const { printerResolveMiddleware } = require("../middleware/printer");
const { generateCorrelationToken } = require("../utils/correlation-token.util");
const { ROLES } = require("../constants/authorization.constants");
const { Floor } = require("../models/Floor");

class PrinterController {
  /**
   * @type {PrinterSocketStore}
   */
  #printerSocketStore;
  /**
   * @type {PrinterService}
   */
  printerService;
  /**
   * @type {PrinterCache}
   */
  printerCache;

  #taskManagerService;
  #octoPrintApiService;
  #pluginRepositoryCache;
  floorStore;

  /**
   * @type {LoggerService}
   */
  #logger;

  constructor({
    printerSocketStore,
    printerService,
    printerCache,
    taskManagerService,
    loggerFactory,
    octoPrintApiService,
    pluginRepositoryCache,
    floorStore,
  }) {
    this.#logger = loggerFactory("PrinterController");
    this.printerCache = printerCache;
    this.printerService = printerService;
    this.#printerSocketStore = printerSocketStore;
    this.#taskManagerService = taskManagerService;
    this.#octoPrintApiService = octoPrintApiService;
    this.#pluginRepositoryCache = pluginRepositoryCache;
    this.floorStore = floorStore;
  }

  async list(req, res) {
    const printers = this.printerCache.listCachedPrinters(true);
    res.send(printers);
  }

  async listPrinterFloors(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const results = await Floor.find({
      "printers.printerId": currentPrinterId,
    });
    res.send(results);
  }

  async getPrinter(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const foundPrinter = this.printerCache.getCachedPrinter(currentPrinterId);
    res.send(foundPrinter);
  }

  async getPrinterSocketInfo(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const foundPrinter = this.#printerSocketStore.getPrinterSocketEvents(currentPrinterId);
    res.send(foundPrinter);
  }

  async getPrinterLoginDetails(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    res.send(printerLogin);
  }

  async restartOctoPrint(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    await this.#octoPrintApiService.postSystemRestartCommand(printerLogin);
    res.send({});
  }

  async sendSerialConnectCommand(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const command = this.#octoPrintApiService.connectCommand;
    await this.#octoPrintApiService.sendConnectionCommand(printerLogin, command);
    res.send({});
  }

  async sendSerialDisconnectCommand(req, res) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.#octoPrintApiService.disconnectCommand;
    await this.#octoPrintApiService.sendConnectionCommand(printerLogin, command);
    res.send({});
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
    res.send({});
  }

  #adjustPrinterObject(printer) {
    // TODO move to service
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
    const createdPrinter = await this.printerService.create(newPrinter);
    const printer = this.printerCache.getCachedPrinter(createdPrinter.id);
    this.#logger.log(`Created printer with ID ${printer.id || printer.correlationToken}`);
    res.send(printer);
  }

  async importBatch(req, res) {
    const importResult = await this.printerService.batchImport(req.body);
    res.send(importResult);
  }

  async delete(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const result = await this.printerService.delete(currentPrinterId);
    await this.floorStore.removePrinterFromAnyFloor(currentPrinterId);
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
    await this.printerService.update(currentPrinterId, updatedPrinter);

    const result = this.printerCache.getCachedPrinter(currentPrinterId);
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

    const newEntity = await this.printerService.updateConnectionSettings(currentPrinterId, inputData);
    res.send({
      printerURL: newEntity.printerURL,
      apiKey: newEntity.apiKey,
      webSocketURL: newEntity.webSocketURL,
    });
  }

  async updateEnabled(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterEnabledRule);

    this.#logger.log("Changing printer enabled setting", JSON.stringify(data));
    await this.printerService.updateEnabled(currentPrinterId, data.enabled);
    res.send({});
  }

  async updatePrinterDisabledReason(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterDisabledReasonRules);

    this.#logger.log("Changing printer disabled reason setting", JSON.stringify(data));
    await this.printerService.updateDisabledReason(currentPrinterId, data.disabledReason);
    res.send({});
  }

  async setFeedRate(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, feedRateRules);

    await this.printerService.updateFeedRate(currentPrinterId, data.feedRate);
    res.send({});
  }

  async setFlowRate(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, flowRateRules);

    await this.printerService.updateFlowRate(currentPrinterId, data.flowRate);
    res.send({});
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

  /**
   * @todo work in progress
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async testConnection(req, res) {
    const newPrinter = await validateMiddleware(req, testPrinterApiRules);
    newPrinter.correlationToken = generateCorrelationToken();
    this.#logger.log(`Testing printer with correlation token ${newPrinter.correlationToken}`);

    // Add printer with test=true
    await this.#printerSocketStore.setupTestPrinter(newPrinter);
    res.send({});
  }

  async refreshPrinterSocket(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    this.#printerSocketStore.reconnectOctoPrint(currentPrinterId);
    res.send({});
  }
}

// prettier-ignore
module.exports = createController(PrinterController)
  .prefix(AppConstants.apiRoute + "/printer")
  .before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN]), printerResolveMiddleware()])
  .get("/", "list")
  .post("/", "create")
  .post("/batch", "importBatch")
  .post("/test-connection", "testConnection")
  .get("/plugin-list", "getPluginList")
  .get("/:id", "getPrinter")
  .get("/:id/socket", "getPrinterSocketInfo")
  .patch("/:id", "update")
  .delete("/:id", "delete")
  .get("/:id/login-details", "getPrinterLoginDetails")
  .post("/:id/restart-octoprint", "restartOctoPrint")
  .post("/:id/serial-connect", "sendSerialConnectCommand")
  .post("/:id/serial-disconnect", "sendSerialDisconnectCommand")
  .post("/:id/job/stop", "stopPrintJob")
  .post("/:id/refresh-socket", "refreshPrinterSocket")
  .patch("/:id/enabled", "updateEnabled")
  .patch("/:id/connection", "updateConnectionSettings")
  .patch("/:id/step-size", "setStepSize")
  .patch("/:id/flow-rate", "setFlowRate")
  .patch("/:id/feed-rate", "setFeedRate")
  .patch("/:id/disabled-reason", "updatePrinterDisabledReason")
  .get("/:id/list-printer-floors", "listPrinterFloors")
  .get("/:id/plugin-list", "getPrinterPluginList");
