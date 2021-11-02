const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const { AppConstants } = require("../server.constants");
const { ROLES } = require("../constants/authorization.constants");

class PrinterNetworkController {
  #printerService;
  #autoDiscoveryService;

  #logger = new Logger("Server-API");

  constructor({ printerService, autoDiscoveryService }) {
    this.#printerService = printerService;
    this.#autoDiscoveryService = autoDiscoveryService;
  }

  async scanSsdp(req, res) {
    let devices = await this.#autoDiscoveryService.searchForDevicesOnNetwork();
    res.json(devices);
  }
}

// prettier-ignore
module.exports = createController(PrinterNetworkController)
  .prefix(AppConstants.apiRoute + "/printer-network")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .post("/scan-ssdp", "scanSsdp");
