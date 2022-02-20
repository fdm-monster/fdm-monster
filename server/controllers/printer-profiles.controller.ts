import {createController} from "awilix-express";
import {AppConstants} from "../server.constants";
import {authenticate, authorizeRoles} from "../middleware/authenticate";
import {printerResolveMiddleware} from "../middleware/printer";
import {getScopedPrinter} from "../handlers/validators";
import {ROLES} from "../constants/authorization.constants";
import {NotImplementedException} from "../exceptions/runtime.exceptions";

class PrinterProfilesController {
    #printerProfilesCache;
    #octoPrintApiService;
    #settingsStore;
    #logger;

    constructor({settingsStore, printerProfilesCache, octoPrintApiService, loggerFactory}) {
        this.#settingsStore = settingsStore;
        this.#printerProfilesCache = printerProfilesCache;
        this.#octoPrintApiService = octoPrintApiService;
        this.#logger = loggerFactory("Server-API");
    }

    async listProfiles(req, res) {
        const {printerLogin} = getScopedPrinter(req);
        const profiles = await this.#octoPrintApiService.listProfiles(printerLogin);
        res.send({profiles});
    }

    async listProfilesCache(req, res) {
        const {currentPrinterId} = getScopedPrinter(req);
        const profiles = await this.#printerProfilesCache.getPrinterProfiles(currentPrinterId);
        res.send({profiles});
    }

    async create(req,res) {
        throw new NotImplementedException();
    }

    async update(req,res) {
        throw new NotImplementedException();
    }

    async delete(req,res) {
        throw new NotImplementedException();
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
