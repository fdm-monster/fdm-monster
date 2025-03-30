import { before, GET, POST, route } from "awilix-express";
import { authenticate, permission } from "@/middleware/authenticate";
import { validateMiddleware } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import { idRulesV2 } from "./validation/generic.validation";
import { PERMS } from "@/constants/authorization.constants";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { PrinterCache } from "@/state/printer.cache";
import { Request, Response } from "express";
import { ParamId } from "@/middleware/param-converter.middleware";
import { setGcodeAnalysisRules } from "@/controllers/validation/printer-settings-controller.validation";

@route(AppConstants.apiRoute + "/printer-settings")
@before([authenticate()])
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

  @GET()
  @route("/:id")
  @before([permission(PERMS.PrinterSettings.Get), ParamId("id")])
  async get(req: Request, res: Response) {
    const loginDto = await this.printerCache.getLoginDtoAsync(req.local.id);
    const settings = await this.octoprintClient.getSettings(loginDto);
    res.send(settings.data);
  }

  @POST()
  @route("/:id/gcode-analysis")
  @before([ParamId("id")])
  async setGCodeAnalysis(req: Request, res: Response) {
    const { enabled } = await validateMiddleware(req, setGcodeAnalysisRules);

    const printerLogin = await this.printerCache.getLoginDtoAsync(req.local.id);
    const settings = await this.octoprintClient.setGCodeAnalysis(printerLogin, enabled);
    res.send(settings.data);
  }

  @POST()
  @route("/:id/sync-printername")
  @before([ParamId("id")])
  async syncPrinterName(req: Request, res: Response) {
    const printerLogin = await this.printerCache.getLoginDtoAsync(req.local.id);
    const name = await this.printerCache.getNameAsync(req.local.id);
    const settings = await this.octoprintClient.updatePrinterNameSetting(printerLogin, name);
    res.send(settings.data);
  }
}
