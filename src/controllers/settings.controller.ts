import { GET, PATCH, PUT, route, before } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import {
  credentialSettingUpdateSchema,
  frontendSettingsUpdateSchema,
  moonrakerSupportSchema,
  prusaLinkSupportSchema,
  sentryDiagnosticsEnabledSchema,
  timeoutSettingsUpdateSchema,
  bambuSupportSchema,
} from "@/services/validators/settings-service.validation";
import { SettingsStore } from "@/state/settings.store";
import { Request, Response } from "express";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { demoUserNotAllowed } from "@/middleware/demo.middleware";
import { PrinterCache } from "@/state/printer.cache";
import { BambuType, PrusaLinkType, MoonrakerType } from "@/services/printer-api.interface";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { PrinterThumbnailCache } from "@/state/printer-thumbnail.cache";
import { loginRequiredSchema, registrationEnabledSchema } from "@/controllers/validation/setting.validation";

@route(AppConstants.apiRoute + "/settings")
@before([authenticate()])
export class SettingsController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly serverVersion: string,
    private readonly printerCache: PrinterCache,
    private readonly printerService: IPrinterService,
    private readonly settingsStore: SettingsStore,
    private readonly printerThumbnailCache: PrinterThumbnailCache,
  ) {
    this.logger = loggerFactory(SettingsController.name);
  }

  @GET()
  @route("/")
  async getSettings(req: Request, res: Response) {
    let connection;
    try {
      connection = {
        clientIp: req.socket?.remoteAddress,
        version: this.serverVersion,
      };
    } catch (e) {
      this.logger.warn("Could not fetch server IP address");
    }
    const settings = this.settingsStore.getSettings();
    res.send({ ...settings, connection });
  }

  @GET()
  @route("/sensitive")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async getSettingsSensitive(req: Request, res: Response) {
    const settings = this.settingsStore.getSettingsSensitive();
    res.send(settings);
  }

  @PATCH()
  @route("/sentry-diagnostics")
  @before([demoUserNotAllowed])
  async updateSentryDiagnosticsEnabled(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, sentryDiagnosticsEnabledSchema);
    const result = this.settingsStore.setSentryDiagnosticsEnabled(enabled);
    res.send(result);
  }

  @PUT()
  @route("/experimental-moonraker-support")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateMoonrakerSupport(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, moonrakerSupportSchema);
    const result = await this.settingsStore.setExperimentalMoonrakerSupport(enabled);

    if (!enabled) {
      const printers = await this.printerCache.listCachedPrinters(false);
      const klipperPrinters = printers.filter((p) => p.printerType === MoonrakerType);
      for (const printer of klipperPrinters) {
        await this.printerService.updateEnabled(printer.id, false);
      }
    }
    res.send(result);
  }

  @PUT()
  @route("/experimental-prusa-link-support")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updatePrusaLinkSupport(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, prusaLinkSupportSchema);
    const result = await this.settingsStore.setExperimentalPrusaLinkSupport(enabled);

    if (!enabled) {
      const printers = await this.printerCache.listCachedPrinters(false);
      const prusaLinkPrinters = printers.filter((p) => p.printerType === PrusaLinkType);
      for (const printer of prusaLinkPrinters) {
        await this.printerService.updateEnabled(printer.id, false);
      }
    }
    res.send(result);
  }

  @PUT()
  @route("/experimental-bambu-support")
  async updateBambuSupport(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, bambuSupportSchema);
    const result = await this.settingsStore.setExperimentalBambuSupport(enabled);

    if (!enabled) {
      const printers = await this.printerCache.listCachedPrinters(false);
      const bambuPrinters = printers.filter((p) => p.printerType === BambuType);
      for (const printer of bambuPrinters) {
        await this.printerService.updateEnabled(printer.id, false);
      }
    }
    res.send(result);
  }

  @PUT()
  @route("/frontend")
  @before([authorizeRoles([ROLES.ADMIN])])
  async updateFrontendSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, frontendSettingsUpdateSchema);
    const result = await this.settingsStore.updateFrontendSettings(validatedInput);
    res.send(result);
  }

  @PUT()
  @route("/login-required")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateLoginRequiredSettings(req: Request, res: Response) {
    const { loginRequired } = await validateInput(req.body, loginRequiredSchema);
    const result = await this.settingsStore.setLoginRequired(loginRequired);
    res.send(result);
  }

  @PUT()
  @route("/registration-enabled")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateRegistrationEnabledSettings(req: Request, res: Response) {
    const { registrationEnabled } = await validateInput(req.body, registrationEnabledSchema);
    const result = await this.settingsStore.setRegistrationEnabled(registrationEnabled);
    res.send(result);
  }

  @PUT()
  @route("/credential")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateCredentialSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, credentialSettingUpdateSchema);
    await this.settingsStore.updateCredentialSettings(validatedInput);
    res.send();
  }

  @PUT()
  @route("/timeout")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateTimeoutSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, timeoutSettingsUpdateSchema);
    const result = await this.settingsStore.updateTimeoutSettings(validatedInput);
    res.send(result);
  }
}
