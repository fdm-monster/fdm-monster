const isDocker = require("is-docker");

const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { isNodemon, isNode, isPm2 } = require("../utils/env.utils");
const { authenticate, withPermission } = require("../middleware/authenticate");
const { PERMS } = require("../constants/authorization.constants");

class ServerPublicController {
  #serverVersion;
  #settingsStore;
  #printersStore;
  #serverUpdateService;

  constructor({ settingsStore, printersStore, serverVersion, serverUpdateService }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#serverUpdateService = serverUpdateService;
  }

  welcome(req, res) {
    const serverSettings = this.#settingsStore.getServerSettings();

    if (serverSettings.server.loginRequired === false || req.isAuthenticated()) {
      return res.send({
        message:
          "Login not required. Please load UI instead by requesting any route with text/html Content-Type"
      });
    }

    res.send({
      message: "Please load the welcome API as this server is not instantiated properly."
    });
  }

  async getVersion(req, res) {
    let updateState = this.#serverUpdateService.getState();

    res.json({
      version: this.#serverVersion,
      isDockerContainer: isDocker(),
      isNodemon: isNodemon(),
      isNode: isNode(),
      isPm2: isPm2(),
      os: process.env.OS,
      update: {
        synced: updateState.synced,
        updateAvailable: updateState.updateAvailable,
        includingPrerelease: updateState.includingPrerelease,
        airGapped: updateState.airGapped
      }
    });
  }
}

// prettier-ignore
module.exports = createController(ServerPublicController)
    .prefix(AppConstants.apiRoute + "/")
    .before([authenticate()])
    .get("", "welcome")
    .get("version", "getVersion", withPermission(PERMS.ServerInfo.Get));
