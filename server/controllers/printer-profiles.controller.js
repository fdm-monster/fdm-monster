const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { ensureAuthenticated } = require("../middleware/auth");
const { printerResolveMiddleware } = require("../middleware/printer");
const { getScopedPrinter } = require("../handlers/validators");

class PrinterProfilesController {
  #printerProfilesCache;
  #octoPrintApiService;

  constructor({ printerProfilesCache, octoPrintApiService }) {
    this.#printerProfilesCache = printerProfilesCache;
    this.#octoPrintApiService = octoPrintApiService;
  }

  async listProfiles(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const profiles = await this.#octoPrintApiService.listProfiles(printerLogin);
    res.send({ profiles });
  }

  async listProfilesCache(req, res) {
    const { currentPrinterId } = getScopedPrinter(req);
    const profiles = await this.#printerProfilesCache.getPrinterProfiles(currentPrinterId);
    res.send({ profiles });
  }
}

module.exports = createController(PrinterProfilesController)
  .prefix(AppConstants.apiRoute + "/printer-profiles")
  .before([ensureAuthenticated, printerResolveMiddleware()])
  .get("/:id/cache", "listCache")
  .get("/:id", "get")
  .post("/:id", "create")
  .patch("/:id", "update")
  .delete("/:id", "delete");
