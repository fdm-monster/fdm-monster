import { createController, GET, PATCH, PUT, route, before } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import {
  clientNextRules,
  credentialSettingPatchRules,
  fileCleanSettingsUpdateRules,
  frontendSettingsUpdateRules,
  moonrakerSupportRules,
  sentryDiagnosticsEnabledRules,
  serverSettingsUpdateRules,
  thumbnailSupportRules,
  timeoutSettingsUpdateRules,
} from "@/services/validators/settings-service.validation";
import { SettingsStore } from "@/state/settings.store";
import { Request, Response } from "express";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { demoUserNotAllowed } from "@/middleware/demo.middleware";
import { IConfigService } from "@/services/core/config.service";
import { PrinterCache } from "@/state/printer.cache";
import { MoonrakerType } from "@/services/printer-api.interface";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { PrinterThumbnailCache } from "@/state/printer-thumbnail.cache";

@route(AppConstants.apiRoute + "/settings")
@before([authenticate()])
export class SettingsController {
  settingsStore: SettingsStore;
  logger: LoggerService;
  printerCache: PrinterCache;
  printerService: IPrinterService;
  configService: IConfigService;
  serverVersion: string;
  private printerThumbnailCache: PrinterThumbnailCache;

  constructor({
    settingsStore,
    printerCache,
    printerService,
    serverVersion,
    loggerFactory,
    configService,
    printerThumbnailCache,
  }: {
    serverVersion: string;
    printerCache: PrinterCache;
    printerService: IPrinterService;
    settingsStore: SettingsStore;
    loggerFactory: ILoggerFactory;
    configService: IConfigService;
    printerThumbnailCache: PrinterThumbnailCache;
  }) {
    this.settingsStore = settingsStore;
    this.logger = loggerFactory(SettingsController.name);
    this.serverVersion = serverVersion;
    this.configService = configService;
    this.printerCache = printerCache;
    this.printerService = printerService;
    this.printerThumbnailCache = printerThumbnailCache;
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
    const { enabled } = await validateInput(req.body, sentryDiagnosticsEnabledRules);
    const result = this.settingsStore.setSentryDiagnosticsEnabled(enabled);
    res.send(result);
  }

  @PUT()
  @route("/experimental-moonraker-support")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateMoonrakerSupport(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, moonrakerSupportRules);
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
  @route("/experimental-thumbnail-support")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateThumbnailSupport(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, thumbnailSupportRules);
    const result = await this.settingsStore.setExperimentalThumbnailSupport(enabled);

    if (enabled) {
      await this.printerThumbnailCache.loadCache();
    } else {
      await this.printerThumbnailCache.resetCache();
    }
    res.send(result);
  }

  @PUT()
  @route("/experimental-client-support")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateClientSupport(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, clientNextRules);
    const result = await this.settingsStore.setExperimentalClientSupport(enabled);
    res.send(result);
  }

  @PUT()
  @route("/frontend")
  @before([authorizeRoles([ROLES.ADMIN])])
  async updateFrontendSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, frontendSettingsUpdateRules);
    const result = await this.settingsStore.updateFrontendSettings(validatedInput);
    res.send(result);
  }

  @PUT()
  @route("/server")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateServerSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, serverSettingsUpdateRules);
    const result = await this.settingsStore.updateServerSettings(validatedInput);
    res.send(result);
  }

  @PUT()
  @route("/login-required")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateLoginRequiredSettings(req: Request, res: Response) {
    const { loginRequired } = await validateInput(req.body, { loginRequired: "required|boolean" });
    const result = await this.settingsStore.setLoginRequired(loginRequired);
    res.send(result);
  }

  @PUT()
  @route("/registration-enabled")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateRegistrationEnabledSettings(req: Request, res: Response) {
    const { registrationEnabled } = await validateInput(req.body, { registrationEnabled: "required|boolean" });
    const result = await this.settingsStore.setRegistrationEnabled(registrationEnabled);
    res.send(result);
  }

  @PUT()
  @route("/credential")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateCredentialSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, credentialSettingPatchRules);
    await this.settingsStore.updateCredentialSettings(validatedInput);
    res.send();
  }

  @PUT()
  @route("/file-clean")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateFileCleanSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, fileCleanSettingsUpdateRules);
    const result = await this.settingsStore.patchFileCleanSettings(validatedInput);
    res.send(result);
  }

  @PUT()
  @route("/timeout")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async updateTimeoutSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, timeoutSettingsUpdateRules);
    const result = await this.settingsStore.updateTimeoutSettings(validatedInput);
    res.send(result);
  }
}
