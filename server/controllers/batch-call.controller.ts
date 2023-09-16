import { createController } from "awilix-express";
import { validateInput } from "@/handlers/validators";
import { batchPrinterRules, batchPrintersEnabledRules } from "./validation/batch-controller.validation";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { BatchCallService } from "@/services/batch-call.service";

export class BatchCallController {
  batchCallService: BatchCallService;

  constructor({ batchCallService }) {
    this.batchCallService = batchCallService;
  }

  async batchConnectUsb(req, res) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const results = await this.batchCallService.batchConnectUsb(printerIds);
    res.send(results);
  }

  async batchConnectSocket(req, res) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    await this.batchCallService.batchConnectSocket(printerIds);
    res.send({});
  }

  async batchReprintFiles(req, res) {
    const { printerIds } = await validateInput(req.body, batchPrinterRules);
    const results = await this.batchCallService.batchReprintCalls(printerIds);
    res.send(results);
  }

  async batchTogglePrintersEnabled(req, res) {
    const { printerIds, enabled } = await validateInput(req.body, batchPrintersEnabledRules);
    const results = await this.batchCallService.batchTogglePrintersEnabled(printerIds, enabled);
    res.send(results);
  }
}

export default createController(BatchCallController)
  .prefix(AppConstants.apiRoute + "/batch")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .post("/connect/usb", "batchConnectUsb")
  .post("/connect/socket", "batchConnectSocket")
  .post("/reprint", "batchReprintFiles")
  .post("/toggle-enabled", "batchTogglePrintersEnabled");
