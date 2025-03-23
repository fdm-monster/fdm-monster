import { createController } from "awilix-express";
import { authenticate, withPermission } from "@/middleware/authenticate";
import { validateInput, validateMiddleware } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import { idRulesV2 } from "./validation/generic.validation";
import { setGcodeAnalysis } from "./validation/printer-settings-controller.validation";
import { PERMS } from "@/constants/authorization.constants";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { PrinterCache } from "@/state/printer.cache";
import { Request, Response } from "express";

export class PrinterSettingsController {
  printerCache: PrinterCache;
  octoprintClient: OctoprintClient;

  constructor({ printerCache, octoprintClient }: { printerCache: PrinterCache; octoprintClient: OctoprintClient }) {
    this.printerCache = printerCache;
    this.octoprintClient = octoprintClient;
  }

  async get(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2);

    const loginDto = await this.printerCache.getLoginDtoAsync(printerId);
    const settings = await this.octoprintClient.getSettings(loginDto);
    res.send(settings.data);
  }

  async setGCodeAnalysis(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2);
    const { enabled } = await validateMiddleware(req, setGcodeAnalysis);

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const settings = await this.octoprintClient.setGCodeAnalysis(printerLogin, enabled);
    res.send(settings.data);
  }

  async syncPrinterName(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2);

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const name = await this.printerCache.getNameAsync(printerId);
    const settings = await this.octoprintClient.updatePrinterNameSetting(printerLogin, name);
    res.send(settings.data);
  }
}

export default createController(PrinterSettingsController)
  .prefix(AppConstants.apiRoute + "/printer-settings")
  .before([authenticate()])
  .get("/:id", "get", withPermission(PERMS.PrinterSettings.Get))
  .post("/:id/gcode-analysis", "setGCodeAnalysis")
  .post("/:id/sync-printername", "syncPrinterName");
