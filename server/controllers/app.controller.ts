import awilixExpress from "awilix-express";
import {AppConstants} from "../server.constants";
import isDocker from "is-docker";
import {authenticate} from "../middleware/authenticate";
import {isNode, isNodemon, isPm2} from "../utils/env.utils";

const {createController} = awilixExpress;

class AppController {
    #serverVersion;
    #settingsStore;
    #printersStore;
    #serverUpdateService;

    constructor({settingsStore, printersStore, serverVersion, serverUpdateService}) {
        this.#settingsStore = settingsStore;
        this.#serverVersion = serverVersion;
        this.#printersStore = printersStore;
        this.#serverUpdateService = serverUpdateService;
    }

    welcome(req, res) {
        const serverSettings = this.#settingsStore.getServerSettings();
        if (serverSettings.server.loginRequired === false || req.isAuthenticated()) {
            res.send({
                message: "Login not required. Please load UI instead by requesting any route with text/html Content-Type"
            });
        } else {
            res.send({
                message: "Please load the welcome API as this server is not instantiated properly."
            });
        }
    }

    async getVersion(req, res) {
        let softwareUpdateNotification = this.#serverUpdateService.getUpdateNotificationIfAny();
        // ensure update_available can only be true when Administrator group found
        if (req?.user?.group !== "Administrator") {
            softwareUpdateNotification.update_available = false;
        }
        res.json({
            version: this.#serverVersion,
            isDockerContainer: isDocker(),
            isNodemon: isNodemon(),
            isNode: isNode(),
            isPm2: isPm2(),
            os: process.env.OS,
            update: softwareUpdateNotification
        });
    }
}

export default createController(AppController)
    .prefix(AppConstants.apiRoute + "/")
    .before([authenticate()])
    //.get("wizard, "wizard")
    .get("", "welcome")
    .get("version", "getVersion");
