import awilixExpress from "awilix-express";
import { AppConstants } from "../server.constants";
import { authenticate as , authorizeRoles } from "../middleware/authenticate.js";
import printer from "../middleware/printer.js";
import validators from "../handlers/validators.js";
import authorization from "../constants/authorization.constants";
const { createController } = awilixExpress;
const { printerResolveMiddleware } = printer;
const { getScopedPrinter } = validators;
const { ROLES } = authorization;
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
export default createController(PrinterProfilesController)
    .prefix(AppConstants.apiRoute + "/printer-profiles")
    .before([
    authenticate(),
    authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR]),
    printerResolveMiddleware()
])
    .get("/:id", "listProfiles")
    .get("/:id/cache", "listProfilesCache")
    .post("/:id", "create")
    .patch("/:id", "update")
    .delete("/:id", "delete");
