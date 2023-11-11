import { createController } from "awilix-express";
import { authenticate, withPermission } from "@/middleware/authenticate";
import { validateInput, validateMiddleware } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import { idRulesV2 } from "./validation/generic.validation";
import { setGcodeAnalysis } from "./validation/printer-settings-controller.validation";
import { PERMS } from "@/constants/authorization.constants";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { PrinterCache } from "@/state/printer.cache";
import { Request, Response } from "express";

export class PrinterSettingsController {
  printerCache: PrinterCache;
  octoPrintApiService: OctoPrintApiService;
  isTypeormMode: boolean;

  constructor({
    printerCache,
    octoPrintApiService,
    isTypeormMode,
  }: {
    printerCache: PrinterCache;
    octoPrintApiService: OctoPrintApiService;
    isTypeormMode: boolean;
  }) {
    this.printerCache = printerCache;
    this.octoPrintApiService = octoPrintApiService;
    this.isTypeormMode = isTypeormMode;
  }

  async get(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    const loginDto = await this.printerCache.getLoginDtoAsync(printerId);
    const settings = await this.octoPrintApiService.getSettings(loginDto);
    res.send(settings);
  }

  async setGCodeAnalysis(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const { enabled } = await validateMiddleware(req, setGcodeAnalysis);

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const settings = await this.octoPrintApiService.setGCodeAnalysis(printerLogin, enabled);
    res.send(settings);
  }

  async syncPrinterName(req: Request, res: Response) {
    const { id: printerId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const name = await this.printerCache.getNameAsync(printerId);
    const settings = await this.octoPrintApiService.updatePrinterNameSetting(printerLogin, name);
    res.send(settings);
  }
}

export default createController(PrinterSettingsController)
  .prefix(AppConstants.apiRoute + "/printer-settings")
  .before([authenticate()])
  .get("/:id", "get", withPermission(PERMS.PrinterSettings.Get))
  .post("/:id/gcode-analysis", "setGCodeAnalysis")
  .post("/:id/sync-printername", "syncPrinterName");
