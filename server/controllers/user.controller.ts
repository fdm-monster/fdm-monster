import {createController} from "awilix-express";
import {AppConstants} from "../server.constants";
import {authenticate, authorizeRoles} from "../middleware/authenticate";
import {ROLES} from "../constants/authorization.constants";
import {validateInput} from "../handlers/validators";
import {idRules} from "./validation/generic.validation";

class UserController {
    #userService;

    constructor({userService}) {
        this.#userService = userService;
    }

    async list(req, res) {
        const users = await this.#userService.listUsers();
        res.send(users);
    }

    async delete(req, res) {
        const {id} = await validateInput(req.params, idRules);
        await this.#userService.deleteUser(id);
        res.send();
    }

    async get(req, res) {
        const {id} = await validateInput(req.params, idRules);
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
