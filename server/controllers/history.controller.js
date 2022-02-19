import awilixExpress from "awilix-express";
import { authenticate as , authorizeRoles } from "../middleware/authenticate.js";
import { AppConstants } from "../server.constants";
import validators from "../handlers/validators.js";
import generic from "./validation/generic.validation";
import service from "../constants/service.constants";
import authorization from "../constants/authorization.constants";
const { createController } = awilixExpress;
const { validateInput, validateMiddleware } = validators;
const { idRules } = generic;
const { getCostSettingsDefault } = service;
const { ROLES } = authorization;
class HistoryController {
    #settingsStore;
    #historyStore;
    constructor({ settingsStore, historyStore }) {
        this.#settingsStore = settingsStore;
        this.#historyStore = historyStore;
    }
    async getCache(req, res) {
        const { history } = this.#historyStore.getHistoryCache();
        res.send({ history });
    }
    async stats(req, res) {
        const stats = this.#historyStore.generateStatistics();
        res.send({ history: stats });
    }
    async delete(req, res) {
        const { id } = await validateInput(req.params, idRules);
        await this.#historyStore.deleteEntry(id);
        res.send();
    }
    async updateCostSettings(req, res) {
        const { id } = await validateInput(req.params, idRules);
        const result = await this.#historyStore.updateCostSettings(id, getCostSettingsDefault());
        res.send(result);
    }
}
export default createController(HistoryController)
    .prefix(AppConstants.apiRoute + "/history")
    .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
    .get("/", "getCache")
    .delete("/:id", "delete")
    // .put("/:id", "update")
    .get("/stats", "stats")
    .patch("/:id/cost-settings", "updateCostSettings");
