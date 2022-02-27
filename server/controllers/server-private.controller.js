const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const Logger = require("../handlers/logger.js");
const { AppConstants } = require("../server.constants");
const { ROLES } = require("../constants/authorization.constants");
const {validateMiddleware} = require("../handlers/validators");
const {updateServerRules} = require("./validation/server-update.validation");

class ServerPrivateController {
  #logger = new Logger("Server-API");
  #systemCommandsService;
  #serverUpdateService;

  constructor({ systemCommandsService, serverUpdateService }) {
    this.#systemCommandsService = systemCommandsService;
    this.#serverUpdateService = serverUpdateService;
  }

  async getUpdateInfo(req, res) {
    await this.#serverUpdateService.syncLatestRelease(false);
    const updateState = this.#serverUpdateService.getState();
    res.send(updateState);
  }

  async updateServer(req, res) {
    const input = await validateMiddleware(req, updateServerRules);
    await this.#systemCommandsService.checkServerUpdate(input);
    res.end();
  }

  async restartServer(req, res) {
    this.#logger.warning("Server restart command fired. Expect the server to be unavailable for a moment");
    await this.#systemCommandsService.restartServer();
    res.end();
  }
}

// prettier-ignore
module.exports = createController(ServerPrivateController)
  .prefix(AppConstants.apiRoute + "/server")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
  .get("/", "getUpdateInfo")
  .post("/update", "updateServer")
  .post("/restart", "restartServer");
