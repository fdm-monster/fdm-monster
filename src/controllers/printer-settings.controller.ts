import { before, GET, POST, route } from "awilix-express";
import { authenticate, permission } from "@/middleware/authenticate";
import { validateMiddleware } from "@/handlers/validators";
import { AppConstants } from "@/server.constants";
import { setGcodeAnalysisSchema } from "./validation/printer-settings-controller.validation";
import { PERMS } from "@/constants/authorization.constants";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { PrinterCache } from "@/state/printer.cache";
import { Request, Response } from "express";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(AppConstants.apiRoute + "/printer-settings")
@before([authenticate()])
export class PrinterSettingsController {
  constructor(private readonly printerCache: PrinterCache, private readonly octoprintClient: OctoprintClient) {}

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
    const { enabled } = await validateMiddleware(req, setGcodeAnalysisSchema);

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
