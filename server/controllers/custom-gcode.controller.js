import awilixExpress from "awilix-express";
import { authenticate as , authorizeRoles } from "../middleware/authenticate.js";
import { AppConstants } from "../server.constants";
import authorization from "../constants/authorization.constants";
import validators from "../handlers/validators.js";
import generic from "./validation/generic.validation";
const { createController } = awilixExpress;
const { ROLES } = authorization;
const { validateMiddleware, validateInput } = validators;
const { idRules } = generic;
class CustomGCodeController {
    #logger;
    #settingsStore;
    #customGCodeService;
    constructor({ settingsStore, customGCodeService, loggerFactory }) {
        this.#settingsStore = settingsStore;
        this.#customGCodeService = customGCodeService;
        this.#logger = loggerFactory("Server-API");
    }
    async list(req, res) {
        const allScripts = await this.#customGCodeService.list();
        res.send(allScripts);
    }
    async create(req, res) {
        const createdScript = await this.#customGCodeService.create(req.body);
        res.send(createdScript);
    }
    async delete(req, res) {
        const { id } = await validateInput(req.params, idRules);
        await this.#customGCodeService.delete(id);
        res.send();
    }
    async update(req, res) {
        const { id } = await validateInput(req.params, idRules);
        const updatedScript = await this.#customGCodeService.update(id, req.body);
        res.send(updatedScript);
    }
}
export default createController(CustomGCodeController)
    .prefix(`${AppConstants.apiRoute}/custom-gcode`)
    .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
    .get("/", "list")
    .post("/", "create")
    .delete("/:id", "delete")
    .put("/:id", "update");
