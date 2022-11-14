const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const Logger = require("../handlers/logger.js");
const { AppConstants } = require("../server.constants");
const { ROLES } = require("../constants/authorization.constants");

class SettingsController {
  #settingsStore;

  constructor({ settingsStore }) {
    this.#settingsStore = settingsStore;
  }

  getServerSettings(req, res) {
    const serverSettings = this.#settingsStore.getServerSettings();
    res.send(serverSettings);
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
  .put("/server", "updateServerSettings");
