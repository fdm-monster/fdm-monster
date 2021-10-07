const Logger = require("nodemon");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const { AppConstants } = require("../app.constants");

class PrinterGroupsController {
  #printerService;
  #printerGroupService;

  #logger = new Logger("Server-API");

  constructor({ printerService, printerGroupService }) {
    this.#printerService = printerService;
    this.#printerGroupService = printerGroupService;
  }

  async list(req, res) {
    const printerGroups = await this.#printerGroupService.list();
    const printers = await Runner.returnFarmPrinters();
    const groups = [];
    for (let i = 0; i < printers.length; i++) {
      await groups.push({
        _id: printers[i]._id,
        group: printers[i].group
      });
    }

    res.send(groups);
  }

  async syncLegacyGroups(req, res) {
    const groups = await this.#printerGroupService.syncPrinterGroups();
    res.send(groups);
  }
}

// prettier-ignore
module.exports = createController(PrinterGroupsController)
  .prefix(AppConstants.apiRoute + "/printer-groups")
  .before([ensureAuthenticated])
  .get("/", "list")
  .put("/sync-legacy", "syncLegacyGroups")
