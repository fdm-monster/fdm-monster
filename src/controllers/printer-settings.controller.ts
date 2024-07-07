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
  isTypeormMode: boolean;

  constructor({
    printerCache,
    octoprintClient,
    isTypeormMode,
  }: {
    printerCache: PrinterCache;
    octoprintClient: OctoprintClient;
    isTypeormMode: boolean;
  }) {
    this.printerCache = printerCache;
    this.octoprintClient = octoprintClient;
    this.isTypeormMode = isTypeormMode;
  }

  async get(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    const loginDto = await this.printerCache.getLoginDtoAsync(printerId);
    const settings = await this.octoprintClient.getSettings(loginDto);
    res.send(settings);
  }

  async setGCodeAnalysis(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const { enabled } = await validateMiddleware(req, setGcodeAnalysis);

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const settings = await this.octoprintClient.setGCodeAnalysis(printerLogin, enabled);
    res.send(settings);
  }

  async syncPrinterName(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const name = await this.printerCache.getNameAsync(printerId);
    const settings = await this.octoprintClient.updatePrinterNameSetting(printerLogin, name);
    res.send(settings);
  }
}

export default createController(PrinterSettingsController)
  .prefix(AppConstants.apiRoute + "/printer-settings")
  .before([authenticate()])
  .get("/:id", "get", withPermission(PERMS.PrinterSettings.Get))
  .post("/:id/gcode-analysis", "setGCodeAnalysis")
  .post("/:id/sync-printername", "syncPrinterName");
