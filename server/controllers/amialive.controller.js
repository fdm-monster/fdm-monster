const { createController } = require("awilix-express");
const isDocker = require("is-docker");
const { AppConstants } = require("../app.constants");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils");
const { ensureCurrentUserAndGroup } = require("../middleware/users");

class AmIAliveController {
  #serverUpdateService;

  constructor({ serverUpdateService }) {
    this.#serverUpdateService = serverUpdateService;
  }

  async index(req, res) {
    let softwareUpdateNotification = this.#serverUpdateService.getUpdateNotificationIfAny();

    // ensure update_available can only be true when Administrator group found
    if (req?.user?.group !== "Administrator") {
      softwareUpdateNotification.update_available = false;
    }

    res.json({
      ok: true,
      isDockerContainer: isDocker(),
      isNodemon: isNodemon(),
      isNode: isNode(),
      isPm2: isPm2(),
      os: process.env.OS,
      update: softwareUpdateNotification
    });
  }
}

// prettier-ignore
module.exports = createController(AmIAliveController)
    .prefix(AppConstants.apiRoute + "/amialive")
    .before([ensureCurrentUserAndGroup])
    .get("", "index");
