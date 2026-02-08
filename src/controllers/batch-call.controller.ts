import { before, POST, route } from "awilix-express";
import { validateInput } from "@/handlers/validators";
import {
  batchPrinterSchema,
  batchPrintersEnabledSchema,
  executeBatchRePrinterSchema,
} from "./validation/batch-controller.validation";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { BatchCallService } from "@/services/core/batch-call.service";
import type { Request, Response } from "express";

@route(AppConstants.apiRoute + "/batch")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
export class BatchCallController {
  constructor(private readonly batchCallService: BatchCallService) {}

  @POST()
  @route("/connect/usb")
  async batchConnectUsb(req: Request, res: Response) {
    const { printerIds } = await validateInput(req.body, batchPrinterSchema);
    const results = await this.batchCallService.batchConnectUsb(printerIds);
    res.send(results);
  }

  @POST()
  @route("/connect/socket")
  async batchConnectSocket(req: Request, res: Response) {
    const { printerIds } = await validateInput(req.body, batchPrinterSchema);
    this.batchCallService.batchConnectSocket(printerIds);
    res.send({});
  }

  @POST()
  @route("/reprint/list")
  async getLastPrintedFiles(req: Request, res: Response) {
    const { printerIds } = await validateInput(req.body, batchPrinterSchema);
    const files = await this.batchCallService.getBatchPrinterReprintFile(printerIds);
    res.send(files);
  }

  @POST()
  @route("/reprint/execute")
  async batchReprintFiles(req: Request, res: Response) {
    const { prints } = await validateInput(req.body, executeBatchRePrinterSchema);
    const files = await this.batchCallService.batchReprintCalls(prints);
    res.send(files);
  }

  @POST()
  @route("/toggle-enabled")
  async batchTogglePrintersEnabled(req: Request, res: Response) {
    const { printerIds, enabled } = await validateInput(req.body, batchPrintersEnabledSchema);
    const results = await this.batchCallService.batchTogglePrintersEnabled(printerIds, enabled);
    res.send(results);
  }
}
