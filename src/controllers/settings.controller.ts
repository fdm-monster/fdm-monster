import { createController } from "awilix-express";
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
  timeoutSettingsUpdateRules,
  whitelistSettingUpdateRules,
} from "@/services/validators/settings-service.validation";
import { SettingsStore } from "@/state/settings.store";
import { Request, Response } from "express";
import { address } from "ip";
import { IpWhitelistSettingsDto } from "@/services/interfaces/settings.dto";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { demoUserNotAllowed, demoUserNotAllowedInterceptor } from "@/middleware/demo.middleware";
import { IConfigService } from "@/services/core/config.service";
import { PrinterCache } from "@/state/printer.cache";
import { MoonrakerType } from "@/services/printer-api.interface";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";

export class SettingsController {
  settingsStore: SettingsStore;
  logger: LoggerService;
  printerCache: PrinterCache;
  printerService: IPrinterService;
  configService: IConfigService;
  serverVersion: string;

  constructor({
    settingsStore,
    printerCache,
    printerService,
    serverVersion,
    loggerFactory,
    configService,
  }: {
    serverVersion: string;
    printerCache: PrinterCache;
    printerService: IPrinterService;
    settingsStore: SettingsStore;
    loggerFactory: ILoggerFactory;
    configService: IConfigService;
  }) {
    this.settingsStore = settingsStore;
    this.logger = loggerFactory(SettingsController.name);
    this.serverVersion = serverVersion;
    this.configService = configService;
    this.printerCache = printerCache;
    this.printerService = printerService;
  }

  getSettings(req: Request, res: Response) {
    // Safely get IP address
    let connection;
    try {
      const serverIp = address();
      connection = {
        clientIp: req.socket?.remoteAddress,
        ip: serverIp,
        version: this.serverVersion,
      };
    } catch (e) {
      this.logger.warn("Could not fetch server IP address");
    }
    const settings = this.settingsStore.getSettings();
    res.send({ ...settings, connection });
  }

  async getSettingsSensitive(req: Request, res: Response) {
    const settings = this.settingsStore.getSettingsSensitive();
    res.send(settings);
  }

  async updateSentryDiagnosticsEnabled(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, sentryDiagnosticsEnabledRules);
    const result = this.settingsStore.setSentryDiagnosticsEnabled(enabled);
    res.send(result);
  }

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

  async updateClientSupport(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, clientNextRules);
    const result = await this.settingsStore.setExperimentalClientSupport(enabled);
    res.send(result);
  }

  async updateWhitelistSettings(req: Request, res: Response) {
    const { whitelistEnabled, whitelistedIpAddresses } = await validateInput<IpWhitelistSettingsDto>(
      req.body,
      whitelistSettingUpdateRules
    );
    if (!whitelistedIpAddresses.includes("127.0.0.1")) {
      whitelistedIpAddresses.push("127.0.0.1");
    }
    await this.settingsStore.setWhitelist(whitelistEnabled, whitelistedIpAddresses);
    res.send();
  }

  async updateFrontendSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, frontendSettingsUpdateRules);
    const result = await this.settingsStore.updateFrontendSettings(validatedInput);
    res.send(result);
  }

  async updateServerSettings(req: Request, res: Response) {
    const isWhitelistFeatureEnabled =
      this.configService.get(AppConstants.ENABLE_EXPERIMENTAL_WHITELIST_SETTINGS, "false") === "true";
    const validatedInput = await validateInput(req.body, serverSettingsUpdateRules(isWhitelistFeatureEnabled));
    const result = await this.settingsStore.updateServerSettings(validatedInput);
    res.send(result);
  }

  async updateLoginRequiredSettings(req: Request, res: Response) {
    const { loginRequired } = await validateInput(req.body, { loginRequired: "required|boolean" });
    const result = await this.settingsStore.setLoginRequired(loginRequired);
    res.send(result);
  }

  async updateRegistrationEnabledSettings(req: Request, res: Response) {
    const { registrationEnabled } = await validateInput(req.body, { registrationEnabled: "required|boolean" });
    const result = await this.settingsStore.setRegistrationEnabled(registrationEnabled);
    res.send(result);
  }

  async updateCredentialSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, credentialSettingPatchRules);
    await this.settingsStore.updateCredentialSettings(validatedInput);
    res.send();
  }

  async updateFileCleanSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, fileCleanSettingsUpdateRules);
    const result = await this.settingsStore.patchFileCleanSettings(validatedInput);
    res.send(result);
  }

  async updateTimeoutSettings(req: Request, res: Response) {
    const validatedInput = await validateInput(req.body, timeoutSettingsUpdateRules);
    const result = await this.settingsStore.updateTimeoutSettings(validatedInput);
    res.send(result);
  }
}

// prettier-ignore
export default createController(SettingsController)
    .prefix(AppConstants.apiRoute + "/settings")
    .before([authenticate()])
    .get("/", "getSettings")
    .get("/sensitive", "getSettingsSensitive", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .patch("/sentry-diagnostics", "updateSentryDiagnosticsEnabled", demoUserNotAllowedInterceptor)
    .put("/experimental-moonraker-support", "updateMoonrakerSupport", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .put("/experimental-client-support", "updateClientSupport", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .put("/server", "updateServerSettings", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .put("/login-required", "updateLoginRequiredSettings", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .put("/registration-enabled", "updateRegistrationEnabledSettings", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .put("/credential", "updateCredentialSettings", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .put("/file-clean", "updateFileCleanSettings", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .put("/whitelist", "updateWhitelistSettings", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] })
    .put("/frontend", "updateFrontendSettings", { before: [authorizeRoles([ROLES.ADMIN])] })
    .put("/timeout", "updateTimeoutSettings", { before: [authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed] });
