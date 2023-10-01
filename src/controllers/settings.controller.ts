import { createController } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import { whitelistSettingRules, sentryDiagnosticsEnabledRules } from "./validation/setting.validation";
import { SettingsStore } from "@/state/settings.store";
import { Request, Response } from "express";
import { IpWhitelistSettingsDto } from "@/services/interfaces/settings.dto";

export class SettingsController {
  settingsStore: SettingsStore;

  constructor({ settingsStore }: { settingsStore: SettingsStore }) {
    this.settingsStore = settingsStore;
  }

  getSettings(req: Request, res: Response) {
    const settings = this.settingsStore.getSettings();
    res.send(settings);
  }

  async updateSentryDiagnosticsEnabled(req: Request, res: Response) {
    const { enabled } = await validateInput(req.body, sentryDiagnosticsEnabledRules);
    const result = this.settingsStore.setSentryDiagnosticsEnabled(enabled);
    res.send(result);
  }

  async updateWhitelistSettings(req: Request, res: Response) {
    const { whitelistEnabled, whitelistedIpAddresses } = await validateInput<IpWhitelistSettingsDto>(
      req.body,
      whitelistSettingRules
    );
    if (!whitelistedIpAddresses.includes("127.0.0.1")) {
      whitelistedIpAddresses.push("127.0.0.1");
    }
    const result = await this.settingsStore.setWhitelist(whitelistEnabled, whitelistedIpAddresses);
    res.send(result);
  }

  async updateFrontendSettings(req: Request, res: Response) {
    const result = await this.settingsStore.updateFrontendSettings(req.body);
    res.send(result);
  }

  async updateServerSettings(req: Request, res: Response) {
    const result = await this.settingsStore.updateServerSettings(req.body);
    res.send(result);
  }
}

// prettier-ignore
export default createController(SettingsController)
  .prefix(AppConstants.apiRoute + "/settings")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
  .get("/server", "getSettings")
  .put("/server/server", "updateServerSettings")
  .patch("/server/sentry-diagnostics", "updateSentryDiagnosticsEnabled")
  .put("/server/whitelist", "updateWhitelistSettings")
  .put("/server/frontend", "updateFrontendSettings");
