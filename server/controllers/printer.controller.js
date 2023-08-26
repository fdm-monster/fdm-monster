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
  createOctoPrintBackupRules,
  getOctoPrintBackupRules,
} = require("./validation/printer-controller.validation");
const { AppConstants } = require("../server.constants");
const { getSettingsAppearanceDefault } = require("../constants/service.constants");
const { printerResolveMiddleware } = require("../middleware/printer");
const { generateCorrelationToken } = require("../utils/correlation-token.util");
const { ROLES } = require("../constants/authorization.constants");
const { Floor } = require("../models/Floor");
const PrinterService = require("../services/printer.service");

class PrinterController {
  /**
   * @type {PrinterSocketStore}
   */
  printerSocketStore;
  /**
   * @type {TestPrinterSocketStore}
   */
  testPrinterSocketStore;
  /**
   * @type {PrinterService}
   */
  printerService;
  /**
   * @type {PrinterCache}
   */
  printerCache;
  /**
   * @type {PrinterEventsCache}
   */
  printerEventsCache;
  /**
   * @type {TaskManagerService}
   */
  taskManagerService;
  /**
   * @type {OctoPrintApiService}
   */
  octoPrintApiService;
  /**
   * @type {PluginRepositoryCache}
   */
  pluginRepositoryCache;
  /**
   * @type {FloorStore}
   */
  floorStore;
  /**
   * @type {MulterService}
   */
  multerService;
  /**
   * @type {LoggerService}
   */
  logger;

  constructor({
    printerSocketStore,
    testPrinterSocketStore,
    printerService,
    printerCache,
    printerEventsCache,
    taskManagerService,
    loggerFactory,
    octoPrintApiService,
    pluginRepositoryCache,
    floorStore,
    multerService,
  }) {
    this.logger = loggerFactory(PrinterController.name);
    this.printerCache = printerCache;
    this.printerEventsCache = printerEventsCache;
    this.printerService = printerService;
    this.printerSocketStore = printerSocketStore;
    this.testPrinterSocketStore = testPrinterSocketStore;
    this.taskManagerService = taskManagerService;
    this.octoPrintApiService = octoPrintApiService;
    this.pluginRepositoryCache = pluginRepositoryCache;
    this.floorStore = floorStore;
    this.multerService = multerService;
  }

  async list(req, res) {
    const printers = await this.printerCache.listCachedPrinters(true);
    // Test transient authentication error
    // throw new AuthenticationError();
    // Test transient authorization error
    // throw new AuthorizationError({
    //   roles: ["ADMIN"],
    // });
    res.send(printers);
  }

  async listPrinterFloors(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    // TODO move to service?
    const results = await Floor.find({
      "printers.printerId": currentPrinterId,
    });
    res.send(results);
  }

  async getPrinter(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const foundPrinter = await this.printerCache.getCachedPrinterOrThrowAsync(currentPrinterId);
    res.send(foundPrinter);
  }

  async getPrinterSocketInfo(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const foundPrinter = await this.printerEventsCache.getPrinterSocketEvents(currentPrinterId);
    res.send(foundPrinter);
  }

  async getPrinterLoginDetails(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    res.send(printerLogin);
  }

  async octoPrintListCommands(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const commands = await this.octoPrintApiService.getSystemCommands(printerLogin);
    res.send(commands);
  }

  async octoPrintSystemRestart(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const result = await this.octoPrintApiService.postSystemRestartCommand(printerLogin);
    res.send(result);
  }

  async sendSerialConnectCommand(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const command = this.octoPrintApiService.connectCommand;
    await this.octoPrintApiService.sendConnectionCommand(printerLogin, command);
    res.send({});
  }

  async sendSerialDisconnectCommand(req, res) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.octoPrintApiService.disconnectCommand;
    await this.octoPrintApiService.sendConnectionCommand(printerLogin, command);
    res.send({});
  }

  /**
   * Pauses the current job
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async pausePrintJob(req, res) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.octoPrintApiService.pauseJobCommand;
    await this.octoPrintApiService.sendJobCommand(printerLogin, command);
    res.send({});
  }

  /**
   * Pauses the current job
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async resumePrintJob(req, res) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.octoPrintApiService.resumeJobCommand;
    await this.octoPrintApiService.sendJobCommand(printerLogin, command);
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

    const command = this.octoPrintApiService.cancelJobCommand;
    await this.octoPrintApiService.sendJobCommand(printerLogin, command);
    res.send({});
  }

  #adjustPrinterObject(printer) {
    // TODO move to service
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
    const printer = await this.printerCache.getCachedPrinterOrThrowAsync(createdPrinter.id);
    this.logger.log(`Created printer with ID ${printer.id || printer.correlationToken}`);
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

    const result = await this.printerCache.getCachedPrinterOrThrowAsync(currentPrinterId);
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
    });
  }

  async updateEnabled(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterEnabledRule);

    this.logger.log("Changing printer enabled setting", JSON.stringify(data));
    await this.printerService.updateEnabled(currentPrinterId, data.enabled);
    res.send({});
  }

  async updatePrinterDisabledReason(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterDisabledReasonRules);

    this.logger.log("Changing printer disabled reason setting", JSON.stringify(data));
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
    let pluginList = await this.pluginRepositoryCache.getCache();
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
    let pluginList = await this.octoPrintApiService.getPluginManagerPlugins(printerLogin);
    res.send(pluginList);
  }

  /**
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async testConnection(req, res) {
    if (req.body.printerURL?.length) {
      req.body.printerURL = PrinterService.normalizeURLWithProtocol(req.body.printerURL);
    }
    const newPrinter = await validateMiddleware(req, testPrinterApiRules);
    newPrinter.correlationToken = generateCorrelationToken();
    this.logger.log(`Testing printer with correlation token ${newPrinter.correlationToken}`);

    // Add printer with test=true
    try {
      await this.testPrinterSocketStore.setupTestPrinter(newPrinter);
    } catch (e) {
      res.send({ correlationToken: newPrinter.correlationToken, failure: true, error: e.toString() });
      return;
    }
    res.send({ correlationToken: newPrinter.correlationToken });
  }

  async refreshPrinterSocket(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    this.printerSocketStore.reconnectOctoPrint(currentPrinterId);
    res.send({});
  }

  async getOctoPrintBackupOverview(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const backupOverview = await this.octoPrintApiService.getBackupOverview(printerLogin);
    res.send(backupOverview);
  }

  async listOctoPrintBackups(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const backupOverview = await this.octoPrintApiService.getBackups(printerLogin);
    res.send(backupOverview);
  }

  async createOctoPrintBackup(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const { exclude } = await validateMiddleware(req, createOctoPrintBackupRules);
    const response = await this.octoPrintApiService.createBackup(printerLogin, exclude);
    res.send(response);
  }

  async downloadOctoPrintBackup(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const { fileName } = await validateMiddleware(req, getOctoPrintBackupRules);
    const dataStream = await this.octoPrintApiService.getDownloadBackupStream(printerLogin, fileName);
    dataStream.pipe(res);
  }

  async restoreOctoPrintBackup(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const files = await this.multerService.multerLoadFileAsync(req, res, null, false);
    const response = await this.octoPrintApiService.forwardRestoreBackupFileStream(printerLogin, files[0].buffer);
    res.send(response.data);
  }

  async deleteOctoPrintBackup(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const { fileName } = await validateMiddleware(req, getOctoPrintBackupRules);
    const response = await this.octoPrintApiService.deleteBackup(printerLogin, fileName);
    res.send(response);
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
  .post("/:id/serial-connect", "sendSerialConnectCommand")
  .post("/:id/serial-disconnect", "sendSerialDisconnectCommand")
  .post("/:id/job/stop", "stopPrintJob")
  .post("/:id/job/pause", "pausePrintJob")
  .post("/:id/job/resume", "resumePrintJob")
  .post("/:id/refresh-socket", "refreshPrinterSocket")
  .patch("/:id/enabled", "updateEnabled")
  .patch("/:id/connection", "updateConnectionSettings")
  .patch("/:id/step-size", "setStepSize")
  .patch("/:id/flow-rate", "setFlowRate")
  .patch("/:id/feed-rate", "setFeedRate")
  .patch("/:id/disabled-reason", "updatePrinterDisabledReason")
  .get("/:id/list-printer-floors", "listPrinterFloors")
  .get("/:id/plugin-list", "getPrinterPluginList")
  .get("/:id/octoprint/system/", "octoPrintListCommands")
  .post("/:id/octoprint/system/restart", "octoPrintSystemRestart")
  .get("/:id/octoprint/backup", "getOctoPrintBackupOverview")
  .get("/:id/octoprint/backup/list", "listOctoPrintBackups")
  .post("/:id/octoprint/backup/download", "downloadOctoPrintBackup")
  .post("/:id/octoprint/backup/restore", "restoreOctoPrintBackup")
  .post("/:id/octoprint/backup/create", "createOctoPrintBackup")
  .delete("/:id/octoprint/backup/delete", "deleteOctoPrintBackup");
