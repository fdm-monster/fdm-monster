const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { AppConstants } = require("../server.constants");
const { ROLES } = require("../constants/authorization.constants");
const { validateInput } = require("../handlers/validators");
const { whitelistSettingRules } = require("./validation/setting.validation");

class SettingsController {
  #settingsStore;

  constructor({ settingsStore }) {
    this.#settingsStore = settingsStore;
  }

  getSettings(req, res) {
    const settings = this.#settingsStore.getSettings();
    res.send(settings);
  }

  async updateWhitelistSettings(req, res) {
    const { whitelistEnabled, whitelistedIpAddresses } = await validateInput(
      req.body,
      whitelistSettingRules
    );
    if (!whitelistedIpAddresses.includes("127.0.0.1")) {
      whitelistedIpAddresses.push("127.0.0.1");
    }
    const result = await this.#settingsStore.setWhitelist(whitelistEnabled, whitelistedIpAddresses);
    res.send(result);
  }

  async updateFrontendSettings(req, res) {
    const result = await this.#settingsStore.updateFrontendSettings(req.body);
    res.send(result);
  }

  async updateSettings(req, res) {
    const result = await this.#settingsStore.updateSettings(req.body);
    res.send(result);
  }
}

// prettier-ignore
module.exports = createController(SettingsController)
  .prefix(AppConstants.apiRoute + "/settings")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
  .get("/server", "getSettings")
  .put("/server", "updateSettings")
  .put("/server/whitelist", "updateWhitelistSettings")
  .put("/server/frontend", "updateFrontendSettings");
