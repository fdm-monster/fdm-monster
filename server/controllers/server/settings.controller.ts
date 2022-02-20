import awilixExpress from "awilix-express";
import {authenticate, authorizeRoles} from "../../middleware/authenticate.js";
import Logger from "../../handlers/logger.js";
import {AppConstants} from "../../server.constants.ts";
import {ROLES} from "../../constants/authorization.constants.js";

const {createController} = awilixExpress;

class SettingsController {
    #logger = new Logger("Server-API");
    #settingsStore;

    constructor({settingsStore}) {
        this.#settingsStore = settingsStore;
    }

    getClientSettings(req, res) {
        const clientSettings = this.#settingsStore.getClientSettings();
        res.send(clientSettings);
    }

    getServerSettings(req, res) {
        const serverSettings = this.#settingsStore.getServerSettings();
        res.send(serverSettings);
    }

    async updateClientSettings(req, res) {
        const result = await this.#settingsStore.updateClientSettings(req.body);
        res.send(result);
    }

    async updateServerSettings(req, res) {
        const result = await this.#settingsStore.updateServerSettings(req.body);
        res.send(result);
    }
}

export default createController(SettingsController)
    .prefix(AppConstants.apiRoute + "/settings")
    .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
    .get("/client", "getClientSettings")
    .put("/client", "updateClientSettings")
    .get("/server", "getServerSettings")
    .put("/server", "updateServerSettings");
