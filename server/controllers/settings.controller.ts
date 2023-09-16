const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { AppConstants } = require("../server.constants");
const { ROLES } = require("../constants/authorization.constants");
const { validateInput } = require("../handlers/validators");
const { whitelistSettingRules, sentryDiagnosticsEnabledRules } = require("./validation/setting.validation");

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
module.exports = createController(SettingsController)
  .prefix(AppConstants.apiRoute + "/settings")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
  .get("/server", "getSettings")
  .put("/server/server", "updateServerSettings")
  .patch("/server/sentry-diagnostics", "updateSentryDiagnosticsEnabled")
  .put("/server/whitelist", "updateWhitelistSettings")
  .put("/server/frontend", "updateFrontendSettings");
