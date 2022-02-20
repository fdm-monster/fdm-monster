const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../../middleware/authenticate");
const Logger = require("../../handlers/logger.js");
const { AppConstants } = require("../../server.constants");
const { ROLES } = require("../../constants/authorization.constants");

class SettingsController {
  #logger = new Logger("Server-API");
  #settingsStore;

  constructor({ settingsStore }) {
    this.#settingsStore = settingsStore;
  }

  getClientSettings(req, res) {
    const clientSettings = this.#settingsStore.getClientSettings();
    res.send(clientSettings);
  }

  getServerSettings(req, res) {
    const serverSettings = this.#settingsStore.getServerSettings();
    res.send(serverSettings);
  }

  async updateClientSettings(req, res) {
    const result = await this.#settingsStore.updateClientSettings(req.body);
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
  .get("/client", "getClientSettings")
  .put("/client", "updateClientSettings")
  .get("/server", "getServerSettings")
  .put("/server", "updateServerSettings");
