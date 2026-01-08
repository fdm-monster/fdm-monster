import { before, DELETE, GET, POST, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { Request, Response } from "express";
import { authorizeRoles, authenticate } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { PrinterMaintenanceLogService } from "@/services/orm/printer-maintenance-log.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { validateInput } from "@/handlers/validators";
import {
  completeMaintenanceLogSchema,
  createMaintenanceLogSchema,
  getMaintenanceLogsQuerySchema,
} from "@/services/validators/printer-maintenance-log.validation";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(AppConstants.apiRoute + "/printer-maintenance-log")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
export class PrinterMaintenanceLogController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerMaintenanceLogService: PrinterMaintenanceLogService,
  ) {
    this.logger = loggerFactory(PrinterMaintenanceLogController.name);
  }

  @GET()
  @route("/")
  async list(req: Request, res: Response) {
    const query = await validateInput(req.query, getMaintenanceLogsQuerySchema);
    const result = await this.printerMaintenanceLogService.list(query);

    res.send({
      logs: result.logs.map((log) => this.printerMaintenanceLogService.toDto(log)),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @GET()
  @route("/:id")
  @before([ParamId("id")])
  async get(req: Request, res: Response) {
    const logId = req.params.id as unknown as number;
    const log = await this.printerMaintenanceLogService.get(logId);
    res.send(this.printerMaintenanceLogService.toDto(log));
  }

  @GET()
  @route("/printer/:printerId/active")
  @before([ParamId("printerId")])
  async getActiveByPrinterId(req: Request, res: Response) {
    const printerId = req.params.printerId as unknown as number;
    const log = await this.printerMaintenanceLogService.getActiveByPrinterId(printerId);
    res.send(log ? this.printerMaintenanceLogService.toDto(log) : null);
  }

  @POST()
  @route("/")
  async create(req: Request, res: Response) {
    const data = await validateInput(req.body, createMaintenanceLogSchema);
    const userId = req.user?.id ?? null;
    const username = req.user?.username || "system";

    const log = await this.printerMaintenanceLogService.create(data, userId, username);
    res.send(this.printerMaintenanceLogService.toDto(log));
  }

  @POST()
  @route("/:id/complete")
  @before([ParamId("id")])
  async complete(req: Request, res: Response) {
    const logId = req.params.id as unknown as number;
    const data = await validateInput(req.body, completeMaintenanceLogSchema);
    const userId = req.user?.id ?? null;
    const username = req.user?.username || "system";

    const log = await this.printerMaintenanceLogService.complete(logId, data, userId, username);
    res.send(this.printerMaintenanceLogService.toDto(log));
  }

  @DELETE()
  @route("/:id")
  @before([ParamId("id")])
  async delete(req: Request, res: Response) {
    const logId = req.params.id as unknown as number;
    await this.printerMaintenanceLogService.delete(logId);
    res.send({ success: true });
  }
}

