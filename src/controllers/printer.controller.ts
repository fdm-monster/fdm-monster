import { createController } from "awilix-express";
import { normalizeURLWithProtocol } from "@/utils/url.utils";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { getScopedPrinter, validateInput, validateMiddleware } from "@/handlers/validators";
import {
  createOctoPrintBackupRules,
  feedRateRules,
  flowRateRules,
  getOctoPrintBackupRules,
  testPrinterApiRules,
  updatePrinterConnectionSettingRules,
  updatePrinterDisabledReasonRules,
  updatePrinterEnabledRule,
} from "./validation/printer-controller.validation";
import { AppConstants } from "@/server.constants";
import { printerResolveMiddleware } from "@/middleware/printer";
import { generateCorrelationToken } from "@/utils/correlation-token.util";
import { ROLES } from "@/constants/authorization.constants";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { TestPrinterSocketStore } from "@/state/test-printer-socket.store";
import { PrinterCache } from "@/state/printer.cache";
import { LoggerService } from "@/handlers/logger";
import { PrinterEventsCache } from "@/state/printer-events.cache";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { PluginRepositoryCache } from "@/services/octoprint/plugin-repository.cache";
import { FloorStore } from "@/state/floor.store";
import { MulterService } from "@/services/core/multer.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Request, Response } from "express";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { LoginDto } from "@/services/interfaces/login.dto";
import { captureException } from "@sentry/node";
import { AxiosError } from "axios";
import { FailedDependencyException } from "@/exceptions/failed-dependency.exception";
import { InternalServerException } from "@/exceptions/runtime.exceptions";

export class PrinterController {
  printerSocketStore: PrinterSocketStore;
  testPrinterSocketStore: TestPrinterSocketStore;
  printerService: IPrinterService;
  printerCache: PrinterCache;
  printerEventsCache: PrinterEventsCache;
  taskManagerService: TaskManagerService;
  octoprintClient: OctoprintClient;
  pluginRepositoryCache: PluginRepositoryCache;
  floorStore: FloorStore;
  multerService: MulterService;
  logger: LoggerService;

  constructor({
    printerSocketStore,
    testPrinterSocketStore,
    printerService,
    printerCache,
    printerEventsCache,
    taskManagerService,
    loggerFactory,
    octoprintClient,
    pluginRepositoryCache,
    floorStore,
    multerService,
  }: {
    printerSocketStore: PrinterSocketStore;
    testPrinterSocketStore: TestPrinterSocketStore;
    printerService: IPrinterService;
    printerCache: PrinterCache;
    printerEventsCache: PrinterEventsCache;
    taskManagerService: TaskManagerService;
    loggerFactory: ILoggerFactory;
    octoprintClient: OctoprintClient;
    pluginRepositoryCache: PluginRepositoryCache;
    floorStore: FloorStore;
    multerService: MulterService;
  }) {
    this.logger = loggerFactory(PrinterController.name);
    this.printerCache = printerCache;
    this.printerEventsCache = printerEventsCache;
    this.printerService = printerService;
    this.printerSocketStore = printerSocketStore;
    this.testPrinterSocketStore = testPrinterSocketStore;
    this.taskManagerService = taskManagerService;
    this.octoprintClient = octoprintClient;
    this.pluginRepositoryCache = pluginRepositoryCache;
    this.floorStore = floorStore;
    this.multerService = multerService;
  }

  async list(req: Request, res: Response) {
    const printers = await this.printerCache.listCachedPrinters(true);

    res.send(printers);
  }

  async getPrinter(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const foundPrinter = await this.printerCache.getCachedPrinterOrThrowAsync(currentPrinterId);
    res.send(foundPrinter);
  }

  async getPrinterSocketInfo(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const foundPrinter = await this.printerEventsCache.getPrinterSocketEvents(currentPrinterId);
    res.send(foundPrinter);
  }

  async getPrinterLoginDetails(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    res.send(printerLogin);
  }

  async octoPrintListCommands(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const commands = await this.octoprintClient.getSystemCommands(printerLogin);
    res.send(commands);
  }

  async octoPrintSystemRestart(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const result = await this.octoprintClient.postSystemRestartCommand(printerLogin);
    res.send(result);
  }

  async sendSerialConnectCommand(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const command = this.octoprintClient.connectCommand;
    await this.octoprintClient.sendConnectionCommand(printerLogin, command);
    res.send({});
  }

  async sendSerialDisconnectCommand(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.octoprintClient.disconnectCommand;
    await this.octoprintClient.sendConnectionCommand(printerLogin, command);
    res.send({});
  }

  async sendPrintHeadJogCommand(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);

    await this.octoprintClient.sendPrintHeadJogCommand(printerLogin, req.body);
    res.send({});
  }

  async sendPrintHeadHomeCommand(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);

    await this.octoprintClient.sendPrintHeadHomeCommand(printerLogin, req.body);
    res.send({});
  }

  async pausePrintJob(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.octoprintClient.pauseJobCommand;
    await this.octoprintClient.sendJobCommand(printerLogin, command);
    res.send({});
  }

  async resumePrintJob(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.octoprintClient.resumeJobCommand;
    await this.octoprintClient.sendJobCommand(printerLogin, command);
    res.send({});
  }

  /**
   * Cancels the current job irrespective of file
   */
  async stopPrintJob(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);

    const command = this.octoprintClient.cancelJobCommand;
    await this.octoprintClient.sendJobCommand(printerLogin, command);
    res.send({});
  }

  async create(req: Request, res: Response) {
    const newPrinter = req.body;

    if (req.query.forceSave !== "true") {
      await this.testOctoPrintConnection(newPrinter);
    }

    // Has internal validation, but might add some here above as well
    const createdPrinter = await this.printerService.create(newPrinter);
    const printer = await this.printerCache.getCachedPrinterOrThrowAsync(createdPrinter.id);
    res.send(printer);
  }

  /**
   * Update the printer entity: printerURL, name, apiKey, enabled
   */
  async update(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const updatedPrinter = req.body;

    if (req.query.forceSave !== "true") {
      await this.testOctoPrintConnection(updatedPrinter);
    }
    await this.printerService.update(currentPrinterId, updatedPrinter);

    const result = await this.printerCache.getCachedPrinterOrThrowAsync(currentPrinterId);
    res.send(result);
  }

  /**
   * Update the printer network connection settings like URL or apiKey - nothing else
   */
  async updateConnectionSettings(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const inputData = await validateMiddleware(req, updatePrinterConnectionSettingRules);

    if (req.query.forceSave !== "true") {
      await this.testOctoPrintConnection(inputData);
    }

    const newEntity = await this.printerService.updateConnectionSettings(currentPrinterId, inputData);
    res.send({
      printerURL: newEntity.printerURL,
      apiKey: newEntity.apiKey,
    });
  }

  private async testOctoPrintConnection(inputLoginDto: LoginDto) {
    const loginDto = (await validateInput(inputLoginDto, updatePrinterConnectionSettingRules)) as LoginDto;
    try {
      await this.octoprintClient.getVersion(loginDto);
    } catch (e) {
      this.logger.log("OctoPrint /api/version test failed");

      if (e instanceof AxiosError) {
        this.logger.debug(e.message + " " + e.status + " " + e.response?.status);
        switch (e.response?.status) {
          case 404:
            // Bad code design or wrong service type
            break;
          case 401:
          case 403: {
            throw new FailedDependencyException("Authentication failed", e.response?.status);
          }
          case 0:
          case 502:
          case 503: {
            throw new FailedDependencyException("OctoPrint unreachable", e.response?.status);
          }
          default: {
            if (!e.response?.status) {
              // F.e. http://localhost:1324
              // ENOTFOUND: DNS problem
              // ECONNREFUSED: Port has no socket bound
              // ERR_BAD_REQUEST
              throw new FailedDependencyException(`Reaching OctoPrint failed without status (code ${e.code})`);
            } else {
              throw new FailedDependencyException(`Reaching OctoPrint failed with status (code ${e.code})`, e.response?.status);
            }
          }
        }
      }

      throw new InternalServerException(`Could not call OctoPrint, internal problem`, (e as Error).stack);
    }
  }

  async importBatch(req: Request, res: Response) {
    const importResult = await this.printerService.batchImport(req.body);
    res.send(importResult);
  }

  async delete(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const result = await this.printerService.delete(currentPrinterId);
    await this.floorStore.removePrinterFromAnyFloor(currentPrinterId);
    res.send(result);
  }

  async updateEnabled(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterEnabledRule);
    await this.printerService.updateEnabled(currentPrinterId, data.enabled);
    res.send({});
  }

  async updatePrinterDisabledReason(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterDisabledReasonRules);
    await this.printerService.updateDisabledReason(currentPrinterId, data.disabledReason);
    res.send({});
  }

  async setFeedRate(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, feedRateRules);

    await this.printerService.updateFeedRate(currentPrinterId, data.feedRate);
    res.send({});
  }

  async setFlowRate(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, flowRateRules);

    await this.printerService.updateFlowRate(currentPrinterId, data.flowRate);
    res.send({});
  }

  /**
   * This list should move to generic controller
   */
  async getPluginList(req: Request, res: Response) {
    let pluginList = await this.pluginRepositoryCache.getCache();
    res.send(pluginList);
  }

  /**
   * List installed plugins (OP 1.6.0+)
   */
  async getPrinterPluginList(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    let pluginList = await this.octoprintClient.getPluginManagerPlugins(printerLogin);
    res.send(pluginList);
  }

  async testConnection(req: Request, res: Response) {
    if (req.body.printerURL?.length) {
      req.body.printerURL = normalizeURLWithProtocol(req.body.printerURL);
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

  async refreshPrinterSocket(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    this.printerSocketStore.reconnectOctoPrint(currentPrinterId);
    await this.printerEventsCache.deletePrinterSocketEvents(currentPrinterId);
    res.send({});
  }

  async getOctoPrintBackupOverview(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const backupOverview = await this.octoprintClient.getBackupOverview(printerLogin);
    res.send(backupOverview);
  }

  async listOctoPrintBackups(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const backupOverview = await this.octoprintClient.getBackups(printerLogin);
    res.send(backupOverview);
  }

  async createOctoPrintBackup(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const { exclude } = await validateMiddleware(req, createOctoPrintBackupRules);
    const response = await this.octoprintClient.createBackup(printerLogin, exclude);
    res.send(response);
  }

  async downloadOctoPrintBackup(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const { fileName } = await validateMiddleware(req, getOctoPrintBackupRules);
    const dataStream = await this.octoprintClient.getDownloadBackupStream(printerLogin, fileName);
    dataStream.pipe(res);
  }

  async restoreOctoPrintBackup(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const files = await this.multerService.multerLoadFileAsync(req, res, null, false);
    const response = await this.octoprintClient.forwardRestoreBackupFileStream(printerLogin, files[0].buffer);
    res.send(response.data);
  }

  async deleteOctoPrintBackup(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const { fileName } = await validateMiddleware(req, getOctoPrintBackupRules);
    const response = await this.octoprintClient.deleteBackup(printerLogin, fileName);
    res.send(response);
  }
}

// prettier-ignore
export default createController(PrinterController)
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
  .post("/:id/jog", "sendPrintHeadJogCommand")
  .post("/:id/home", "sendPrintHeadHomeCommand")
  .post("/:id/job/stop", "stopPrintJob")
  .post("/:id/job/pause", "pausePrintJob")
  .post("/:id/job/resume", "resumePrintJob")
  .post("/:id/refresh-socket", "refreshPrinterSocket")
  .patch("/:id/enabled", "updateEnabled")
  .patch("/:id/connection", "updateConnectionSettings")
  .patch("/:id/flow-rate", "setFlowRate")
  .patch("/:id/feed-rate", "setFeedRate")
  .patch("/:id/disabled-reason", "updatePrinterDisabledReason")
  .get("/:id/plugin-list", "getPrinterPluginList")
  .get("/:id/octoprint/system/", "octoPrintListCommands")
  .post("/:id/octoprint/system/restart", "octoPrintSystemRestart")
  .get("/:id/octoprint/backup", "getOctoPrintBackupOverview")
  .get("/:id/octoprint/backup/list", "listOctoPrintBackups")
  .post("/:id/octoprint/backup/download", "downloadOctoPrintBackup")
  .post("/:id/octoprint/backup/restore", "restoreOctoPrintBackup")
  .post("/:id/octoprint/backup/create", "createOctoPrintBackup")
  .delete("/:id/octoprint/backup/delete", "deleteOctoPrintBackup");
