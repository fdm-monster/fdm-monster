import { createController } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import { whitelistSettingRules, sentryDiagnosticsEnabledRules } from "./validation/setting.validation";

export class SettingsController {
  /**
   * @type {SettingsStore}
   */
  settingsStore;

  constructor({ settingsStore }) {
    this.settingsStore = settingsStore;
  }

  getSettings(req, res) {
    const settings = this.settingsStore.getSettings();
    res.send(settings);
  }

  async updateSentryDiagnosticsEnabled(req, res) {
    const { enabled } = await validateInput(req.body, sentryDiagnosticsEnabledRules);
    const result = this.settingsStore.setSentryDiagnosticsEnabled(enabled);
    res.send(result);
  }

  async updateWhitelistSettings(req, res) {
    const { whitelistEnabled, whitelistedIpAddresses } = await validateInput(req.body, whitelistSettingRules);
    if (!whitelistedIpAddresses.includes("127.0.0.1")) {
      whitelistedIpAddresses.push("127.0.0.1");
    }
    const result = await this.settingsStore.setWhitelist(whitelistEnabled, whitelistedIpAddresses);
    res.send(result);
  }

  async updateFrontendSettings(req, res) {
    const result = await this.settingsStore.updateFrontendSettings(req.body);
    res.send(result);
  }

  async updateServerSettings(req, res) {
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
