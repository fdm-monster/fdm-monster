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

  getServerSettings(req, res) {
    const serverSettings = this.#settingsStore.getServerSettings();
    res.send(serverSettings);
  }

  async updateWhitelistSettings(req, res) {
    const { whitelistEnabled, whitelistedIpAddresses } = await validateInput(
      req.body,
      whitelistSettingRules
    );
    const result = await this.#settingsStore.setWhitelist(whitelistEnabled, whitelistedIpAddresses);
    res.send(result);
  }

  async updateServerSettings(req, res) {
    const result = await this.#settingsStore.updateServerSettings(req.body);
    res.send(result);
  }
}

// prettier-ignore
module.exports = createController(SettingsController)
  .prefix(AppConstants.apiRoute + "/settings")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
  .get("/server", "getServerSettings")
  .put("/server/whitelist", "updateWhitelistSettings")
  .put("/server", "updateServerSettings");
