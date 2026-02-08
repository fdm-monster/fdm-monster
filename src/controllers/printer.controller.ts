import { before, DELETE, GET, PATCH, POST, route } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { validateInput, validateMiddleware } from "@/handlers/validators";
import {
  feedRateSchema,
  flowRateSchema,
  testPrinterApiSchema,
  updatePrinterDisabledReasonSchema,
  updatePrinterEnabledSchema,
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
import { FloorStore } from "@/state/floor.store";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import type { Request, Response } from "express";
import type { IPrinterService } from "@/services/interfaces/printer.service.interface";
import type { LoginDto } from "@/services/interfaces/login.dto";
import { AxiosError } from "axios";
import { FailedDependencyException } from "@/exceptions/failed-dependency.exception";
import { InternalServerException } from "@/exceptions/runtime.exceptions";
import type { IPrinterApi } from "@/services/printer-api.interface";
import { PrinterApiFactory } from "@/services/printer-api.factory";
import { normalizeUrl } from "@/utils/normalize-url";
import { defaultHttpProtocol } from "@/utils/url.utils";
import { getScopedPrinter } from "@/middleware/printer-resolver";

@route(AppConstants.apiRoute + "/printer")
@before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN]), printerResolveMiddleware()])
export class PrinterController {
  logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerApiFactory: PrinterApiFactory,
    private readonly printerSocketStore: PrinterSocketStore,
    private readonly testPrinterSocketStore: TestPrinterSocketStore,
    private readonly printerService: IPrinterService,
    private readonly printerCache: PrinterCache,
    private readonly printerEventsCache: PrinterEventsCache,
    private readonly printerApi: IPrinterApi,
    private readonly floorStore: FloorStore,
  ) {
    this.logger = loggerFactory(PrinterController.name);
  }

  @GET()
  @route("/")
  async list(req: Request, res: Response) {
    res.send(await this.printerCache.listCachedPrinters(true));
  }

  @POST()
  @route("/")
  async create(req: Request, res: Response) {
    const newPrinter = req.body;
    if (req.query.forceSave !== "true") {
      await this.testPrintApiConnection(newPrinter);
    }

    // Has internal validation, but might add some here above as well
    const createdPrinter = await this.printerService.create(newPrinter);
    res.send(await this.printerCache.getCachedPrinterOrThrowAsync(createdPrinter.id));
  }

  @POST()
  @route("/batch")
  async createBatch(req: Request, res: Response) {
    const importResult = await this.printerService.batchImport(req.body);
    res.send(importResult);
  }

  @GET()
  @route("/:id")
  async getPrinter(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    res.send(await this.printerCache.getCachedPrinterOrThrowAsync(currentPrinterId));
  }

  @GET()
  @route("/:id/socket")
  async getPrinterSocketInfo(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    res.send(await this.printerEventsCache.getPrinterSocketEvents(currentPrinterId));
  }

  @PATCH()
  @route("/:id")
  async update(req: Request, res: Response) {
    const forceSave = req.query.forceSave === "true";

    // Update the printer entity: printerURL, name, apiKey, enabled
    const { currentPrinterId } = getScopedPrinter(req);
    const updatedPrinter = req.body;
    if (!forceSave) {
      await this.testPrintApiConnection(updatedPrinter);
    }

    await this.printerService.update(currentPrinterId, updatedPrinter);
    res.send(await this.printerCache.getCachedPrinterOrThrowAsync(currentPrinterId));
  }

  @DELETE()
  @route("/:id")
  async delete(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    await this.printerService.delete(currentPrinterId);
    await this.floorStore.removePrinterFromAnyFloor(currentPrinterId);
    res.send();
  }

  @PATCH()
  @route("/:id/enabled")
  async updateEnabled(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterEnabledSchema);
    await this.printerService.updateEnabled(currentPrinterId, data.enabled);
    res.send({});
  }

  @PATCH()
  @route("/:id/disabled-reason")
  async updatePrinterDisabledReason(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, updatePrinterDisabledReasonSchema);
    await this.printerService.updateDisabledReason(currentPrinterId, data.disabledReason);
    res.send({});
  }

  @POST()
  @route("/:id/refresh-socket")
  async refreshPrinterSocket(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    this.printerSocketStore.reconnectPrinterAdapter(currentPrinterId);
    await this.printerEventsCache.deletePrinterSocketEvents(currentPrinterId);
    res.send({});
  }

  @POST()
  @route("/test-connection")
  async testConnection(req: Request, res: Response) {
    if (req.body.printerURL?.length) {
      req.body.printerURL = normalizeUrl(req.body.printerURL, { defaultProtocol: defaultHttpProtocol });
    }
    const newPrinter = await validateMiddleware(req, testPrinterApiSchema);
    const printerCorrelationToken = generateCorrelationToken();
    this.logger.log(`Testing printer with correlation token ${printerCorrelationToken}`);

    try {
      await this.testPrinterSocketStore.setupTestPrinter(printerCorrelationToken, newPrinter);
    } catch (e) {
      res.send({ correlationToken: printerCorrelationToken, failure: true, error: (e as Error).toString() });
      return;
    }
    res.send({ correlationToken: printerCorrelationToken });
  }

  @GET()
  @route("/:id/login-details")
  async getPrinterLoginDetails(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    res.send(printerLogin);
  }

  /**
   * Sends gcode according to https://docs.octoprint.org/en/master/api/printer.html#send-an-arbitrary-command-to-the-printer
   */
  @POST()
  @route("/:id/send-emergency-m112")
  async sendEmergencyM112(req: Request, res: Response) {
    const { printerApi } = getScopedPrinter(req);
    await printerApi.quickStop();
    res.send();
  }

  @POST()
  @route("/:id/serial-connect")
  async sendSerialConnectCommand(req: Request, res: Response) {
    await this.printerApi.connect();
    res.send({});
  }

  @POST()
  @route("/:id/serial-disconnect")
  async sendSerialDisconnectCommand(req: Request, res: Response) {
    await this.printerApi.disconnect();
    res.send({});
  }

  @POST()
  @route("/:id/jog")
  @route("/:id/move")
  async movePrintHead(req: Request, res: Response) {
    await this.printerApi.movePrintHead(req.body);
    res.send({});
  }

  @POST()
  @route("/:id/home")
  async homeAxes(req: Request, res: Response) {
    await this.printerApi.homeAxes(req.body);
    res.send({});
  }

  @POST()
  @route("/:id/job/pause")
  async pausePrint(req: Request, res: Response) {
    await this.printerApi.pausePrint();
    res.send({});
  }

  @POST()
  @route("/:id/job/resume")
  async resumePrint(req: Request, res: Response) {
    await this.printerApi.resumePrint();
    res.send({});
  }

  @POST()
  @route("/:id/job/stop")
  @route("/:id/job/cancel")
  async cancelPrint(req: Request, res: Response) {
    await this.printerApi.cancelPrint();
    res.send({});
  }

  @POST()
  @route("/:id/octoprint/server/restart")
  @route("/:id/server/restart")
  async restartServer(req: Request, res: Response) {
    await this.printerApi.restartServer();
    res.send();
  }

  @PATCH()
  @route("/:id/feed-rate")
  async setFeedRate(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, feedRateSchema);

    await this.printerService.updateFeedRate(currentPrinterId, data.feedRate);
    res.send({});
  }

  @PATCH()
  @route("/:id/flow-rate")
  async setFlowRate(req: Request, res: Response) {
    const { currentPrinterId } = getScopedPrinter(req);
    const data = await validateMiddleware(req, flowRateSchema);
    await this.printerService.updateFlowRate(currentPrinterId, data.flowRate);
    res.send({});
  }

  private async testPrintApiConnection(inputLoginDto: LoginDto) {
    await validateInput(inputLoginDto, testPrinterApiSchema);

    this.logger.debug(`Testing API connection for printer type: ${inputLoginDto.printerType}`, inputLoginDto);

    try {
      const printerApi = this.printerApiFactory.getScopedPrinter(inputLoginDto);
      await printerApi.validateConnection();
      this.logger.debug("Connection validation completed successfully");
    } catch (e) {
      this.logger.log("Printer connection validation failed");
      this.logger.debug(`Error details: ${e}`);

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
            throw new FailedDependencyException("Printer service unreachable", e.response?.status);
          }
          default: {
            if (e.response?.status) {
              throw new FailedDependencyException(
                `Reaching Printer service failed with status (code ${e.code})`,
                e.response?.status,
              );
            } else {
              // F.e. http://localhost:1324
              // ENOTFOUND: DNS problem
              // ECONNREFUSED: Port has no socket bound
              // ERR_BAD_REQUEST
              throw new FailedDependencyException(`Reaching Printer service failed without status (code ${e.code})`);
            }
          }
        }
      }

      throw new InternalServerException(`Could not call Printer service, internal problem`, (e as Error).stack);
    }
  }
}
