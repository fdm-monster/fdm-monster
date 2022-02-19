import awilixExpress from "awilix-express";
import { AppConstants } from "../server.constants";
import { authenticate as , authorizeRoles } from "../middleware/authenticate.js";
import authorization from "../constants/authorization.constants";
import validators from "../handlers/validators.js";
import generic from "./validation/generic.validation";
const { createController } = awilixExpress;
const { ROLES } = authorization;
const { validateInput } = validators;
const { idRules } = generic;
class UserController {
    #userService;
    constructor({ userService }) {
        this.#userService = userService;
    }
    async list(req, res) {
        const users = await this.#userService.listUsers();
        res.send(users);
    }
    async delete(req, res) {
        const { id } = await validateInput(req.params, idRules);
        await this.#userService.deleteUser(id);
        res.send();
    }
    async get(req, res) {
        const { id } = await validateInput(req.params, idRules);
        const users = await this.#userService.getUser(id);
        res.send(users);
    }
}
export default createController(UserController)
    .prefix(AppConstants.apiRoute + "/user")
    .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
    .get("/", "list")
    .get("/:id", "get")
    .delete("/:id", "delete");
