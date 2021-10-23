const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");
const { AppConstants } = require("../../server.constants");

class ServerCommandsController {
  #logger = new Logger("Server-API");
  #systemCommandsService;
  #serverUpdateService;

  constructor({ systemCommandsService, serverUpdateService }) {
    this.#systemCommandsService = systemCommandsService;
    this.#serverUpdateService = serverUpdateService;
  }

  async checkUpdate(req, res) {
    await this.#serverUpdateService.checkReleaseAndLogUpdate();
    const softwareUpdateNotification = this.#serverUpdateService.getUpdateNotificationIfAny();
    res.send(softwareUpdateNotification);
  }

  async updateServer(req, res) {
    let clientResponse = {
      success: false,
      statusTypeForUser: "error",
      message: ""
    };
    let force = req?.body;
    if (
      !force ||
      typeof force?.forcePull !== "boolean" ||
      typeof force?.doWeInstallPackages !== "boolean"
    ) {
      res.sendStatus(400);
      throw new Error("forceCheck object not correctly provided or not boolean");
    }

    try {
      clientResponse = await this.#systemCommandsService.checkServerUpdate(clientResponse, force);
    } catch (e) {
      clientResponse.message = "Issue with updating | " + e?.message.replace(/(<([^>]+)>)/gi, "");
      // Log error with html tags removed if contained in response message
      this.#logger.error("Issue with updating | ", e?.message.replace(/(<([^>]+)>)/gi, ""));
    } finally {
      res.send(clientResponse);
    }
  }

  async restartServer(req, res) {
    let serviceRestarted = false;
    try {
      serviceRestarted = await this.#systemCommandsService.restartServer();
    } catch (e) {
      this.#logger.error(e);
    }
    res.send(serviceRestarted);
  }
}

// prettier-ignore
module.exports = createController(ServerCommandsController)
  .prefix(AppConstants.apiRoute + "/settings/server")
  .before([ensureAuthenticated])
  .get("/update/check", "checkUpdate")
  .post("/update/server", "updateServer")
  .patch("/restart", "restartServer");
