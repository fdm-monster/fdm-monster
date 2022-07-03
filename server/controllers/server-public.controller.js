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
  #serverReleaseService;

  constructor({ settingsStore, printersStore, serverVersion, serverReleaseService }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#serverReleaseService = serverReleaseService;
  }

  welcome(req, res) {
    const serverSettings = this.#settingsStore.getServerSettings();

    if (serverSettings.server.loginRequired === false) {
      return res.send({
        message: "Login disabled. Please load the Vue app."
      });
    }

    return res.send({
      message: "Login successful. Please load the Vue app."
    });
  }

  async getVersion(req, res) {
    let updateState = this.#serverReleaseService.getState();

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
