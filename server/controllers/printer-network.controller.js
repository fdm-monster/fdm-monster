import { authenticate as , authorizeRoles } from "../middleware/authenticate.js";
import awilixExpress from "awilix-express";
import Logger from "../handlers/logger.js";
import { AppConstants } from "../server.constants";
import authorization from "../constants/authorization.constants";
const { createController } = awilixExpress;
const { ROLES } = authorization;
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
export default createController(PrinterNetworkController)
    .prefix(AppConstants.apiRoute + "/printer-network")
    .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
    .post("/scan-ssdp", "scanSsdp");
