const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const { AppConstants } = require("../app.constants");

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
  .before([ensureAuthenticated])
  .get("/scan-ssdp", "scanSsdp")
  .post("/wake-host", "wakeHost");
