import { createController } from "awilix-express";
import { authenticate, withPermission } from "@/middleware/authenticate";
import { validateInput, validateMiddleware } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import { idRules } from "./validation/generic.validation";
import { setGcodeAnalysis } from "./validation/printer-settings-controller.validation";
import { PERMS } from "@/constants/authorization.constants";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { PrinterCache } from "@/state/printer.cache";
import { Request, Response } from "express";

export class PrinterSettingsController {
  printerCache: PrinterCache;
  octoPrintApiService: OctoPrintApiService;

  constructor({ printerCache, octoPrintApiService }: { printerCache: PrinterCache; octoPrintApiService: OctoPrintApiService }) {
    this.printerCache = printerCache;
    this.octoPrintApiService = octoPrintApiService;
  }

  async get(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const settings = await this.octoPrintApiService.getSettings(printerLogin);
    res.send(settings);
  }

  async setGCodeAnalysis(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const input = await validateMiddleware(req, setGcodeAnalysis);

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const settings = await this.octoPrintApiService.setGCodeAnalysis(printerLogin, input);
    res.send(settings);
  }

  async syncPrinterName(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const printerName = await this.printerCache.getNameAsync(printerId);
    const settings = await this.octoPrintApiService.updatePrinterNameSetting(printerLogin, printerName);
    res.send(settings);
  }
}

export default createController(PrinterSettingsController)
  .prefix(AppConstants.apiRoute + "/printer-settings")
  .before([authenticate()])
  .get("/:id", "get", withPermission(PERMS.PrinterSettings.Get))
  .post("/:id/gcode-analysis", "setGCodeAnalysis")
  .post("/:id/sync-printername", "syncPrinterName");
