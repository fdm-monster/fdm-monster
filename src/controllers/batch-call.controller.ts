import { createController } from "awilix-express";
import { validateInput } from "@/handlers/validators";
import {
  batchPrinterRules,
  batchPrintersEnabledRules,
  executeBatchRePrinterRule,
} from "./validation/batch-controller.validation";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { BatchCallService } from "@/services/core/batch-call.service";
import { Request, Response } from "express";

export class BatchCallController {
  batchCallService: BatchCallService;

  constructor({ batchCallService }: { batchCallService: BatchCallService }) {
    this.batchCallService = batchCallService;
  }

  async batchSettingsGet(req: Request, res: Response) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const results = await this.batchCallService.batchSettingsGet(printerIds);
    res.send(results);
  }

  async batchConnectUsb(req: Request, res: Response) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const results = await this.batchCallService.batchConnectUsb(printerIds);
    res.send(results);
  }

  async batchConnectSocket(req: Request, res: Response) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    this.batchCallService.batchConnectSocket(printerIds);
    res.send({});
  }

  async getLastPrintedFiles(req: Request, res: Response) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const files = await this.batchCallService.getBatchPrinterReprintFile(printerIds);
    res.send(files);
  }

  async batchReprintFiles(req: Request, res: Response) {
    const { prints } = await validateInput(req.body, executeBatchRePrinterRule);
    const files = await this.batchCallService.batchReprintCalls(prints);
    res.send(files);
  }

  async batchTogglePrintersEnabled(req: Request, res: Response) {
    const { printerIds, enabled } = await validateInput(req.body, batchPrintersEnabledRules);
    const results = await this.batchCallService.batchTogglePrintersEnabled(printerIds, enabled);
    res.send(results);
  }
}

export default createController(BatchCallController)
  .prefix(AppConstants.apiRoute + "/batch")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .post("/settings/get", "batchSettingsGet")
  .post("/connect/usb", "batchConnectUsb")
  .post("/connect/socket", "batchConnectSocket")
  .post("/reprint/list", "getLastPrintedFiles")
  .post("/reprint/execute", "batchReprintFiles")
  .post("/toggle-enabled", "batchTogglePrintersEnabled");
