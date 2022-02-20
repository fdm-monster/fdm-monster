import {createController} from "awilix-express";
import {authenticate, withPermission} from "../middleware/authenticate";
import {AppConstants} from "../server.constants";
import {validateInput} from "../handlers/validators";
import {idRules} from "./validation/generic.validation";
import {createAlertRules, testAlertScriptRules, updateAlertRules} from "./validation/alert-controller.validation";
import {PERMS} from "../constants/authorization.constants";

class AlertController {
    #settingsStore;
    #alertService;
    #scriptService;
    #logger;

    constructor({settingsStore, alertService, scriptService, loggerFactory}) {
        this.#settingsStore = settingsStore;
        this.#logger = loggerFactory("Server-API");
        this.#alertService = alertService;
        this.#scriptService = scriptService;
    }

    async list(req, res) {
        const alerts = await this.#alertService.list();
        res.send(alerts);
    }

    async create(req, res) {
        const data = await validateInput(req.body, createAlertRules);
        let createdAlert = await this.#alertService.create(data);
        res.send(createdAlert);
    }

    async update(req, res) {
        const params = await validateInput(req.params, idRules);
        const alertId = params.id;
        const updateData = await validateInput(req.body, updateAlertRules);
        let doc = await this.#alertService.update(alertId, updateData);
        res.send(doc);
    }

    async delete(req, res) {
        const {id} = await validateInput(req.params, idRules);
        await this.#alertService.delete(id);
        res.send();
    }

    async testAlertScript(req, res) {
        const {scriptLocation, message} = await validateInput(req.body, testAlertScriptRules);
        let testExecution = await this.#scriptService.execute(scriptLocation, message);
        res.send(testExecution);
    }
}

export default createController(AlertController)
    .prefix(AppConstants.apiRoute + "/alert")
    .before([authenticate()])
    .get("/", "list")
    .post("/", "create")
    .put("/:id", "update")
    .delete("/:id", "delete")
    .post("/test-alert-script", "testAlertScript", withPermission(PERMS.Alerts.Test));
