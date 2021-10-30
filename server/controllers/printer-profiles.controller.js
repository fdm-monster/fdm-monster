const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate } = require("../middleware/authenticate");
const { printerResolveMiddleware } = require("../middleware/printer");
const { getScopedPrinter } = require("../handlers/validators");

class PrinterProfilesController {
  #printerProfilesCache;
  #octoPrintApiService;
  #settingsStore;
  #logger;

  constructor({ settingsStore, printerProfilesCache, octoPrintApiService, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#printerProfilesCache = printerProfilesCache;
    this.#octoPrintApiService = octoPrintApiService;
    this.#logger = loggerFactory("Server-API");
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
  .before([authenticate(), printerResolveMiddleware()])
  .get("/:id", "listProfiles")
  .get("/:id/cache", "listProfilesCache")
  .post("/:id", "create")
  .patch("/:id", "update")
  .delete("/:id", "delete");
