import awilixExpress from "awilix-express";
import { authenticate as , authorizeRoles } from "../../middleware/authenticate.js";
import Logger from "../../handlers/logger.js";
import { AppConstants } from "../../server.constants";
import authorization from "../../constants/authorization.constants";
const { createController } = awilixExpress;
const { ROLES } = authorization;
class ServerCommandsController {
    #logger = new Logger("Server-API");
    #systemCommandsService;
    #serverUpdateService;
    constructor({ systemCommandsService, serverUpdateService }) {
        this.#systemCommandsService = systemCommandsService;
        this.#serverUpdateService = serverUpdateService;
    }
    async checkUpdate(req, res) {
        await this.#serverUpdateService.checkReleaseAndLogUpdate();
        const softwareUpdateNotification = this.#serverUpdateService.getUpdateNotificationIfAny();
        res.send(softwareUpdateNotification);
    }
    async updateServer(req, res) {
        let clientResponse = {
            success: false,
            statusTypeForUser: "error",
            message: ""
        };
        let force = req?.body;
        if (!force ||
            typeof force?.forcePull !== "boolean" ||
            typeof force?.doWeInstallPackages !== "boolean") {
            res.sendStatus(400);
            throw new Error("forceCheck object not correctly provided or not boolean");
        }
        try {
            clientResponse = await this.#systemCommandsService.checkServerUpdate(clientResponse, force);
        }
        catch (e) {
            clientResponse.message = "Issue with updating | " + e?.message.replace(/(<([^>]+)>)/gi, "");
            // Log error with html tags removed if contained in response message
            this.#logger.error("Issue with updating | ", e?.message.replace(/(<([^>]+)>)/gi, ""));
        }
        finally {
            res.send(clientResponse);
        }
    }
    async restartServer(req, res) {
        let serviceRestarted = false;
        try {
            serviceRestarted = await this.#systemCommandsService.restartServer();
        }
        catch (e) {
            this.#logger.error(e);
        }
        res.send(serviceRestarted);
    }
}
export default createController(ServerCommandsController)
    .prefix(AppConstants.apiRoute + "/settings/server")
    .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
    .get("/update/check", "checkUpdate")
    .post("/update/server", "updateServer")
    .patch("/restart", "restartServer");
