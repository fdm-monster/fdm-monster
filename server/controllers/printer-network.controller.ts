import {authenticate, authorizeRoles} from "../middleware/authenticate";
import {createController} from "awilix-express";
import {AppConstants} from "../server.constants";
import {ROLES} from "../constants/authorization.constants";

class PrinterNetworkController {
    #printerService;
    #autoDiscoveryService;

    constructor({printerService, autoDiscoveryService}) {
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
