const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");
const { printerResolveMiddleware } = require("../middleware/printer");

const cacheKey = "firmware-state";

class PluginFirmwareUpdateController {
  #cacheManager;

  constructor({ cacheManager }) {
    this.#cacheManager = cacheManager;
  }

  async listUpdateState(req, res) {
    const result = this.#cacheManager.get(cacheKey);
    res.send({
      cache: result
    });
  }

  async scanPrinterFirmwareVersions(req, res) {
    this.#cacheManager.set(cacheKey, true);
  }
}

module.exports = createController(PluginFirmwareUpdateController)
  .prefix(AppConstants.apiRoute + "/plugin/firmware-update")
  .before([
    authenticate(),
    authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN]),
    printerResolveMiddleware()
  ])
  .get("/", "listUpdateState")
  .post("/scan", "scanPrinterFirmwareVersions");
