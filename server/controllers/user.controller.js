const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");
const { validateMiddleware } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");

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
    const { id } = await validateMiddleware(req, idRules);
    await this.#userService.deleteUser(id);
    res.send();
  }

  async get(req, res) {
    const { id } = await validateMiddleware(req, idRules);
    const users = await this.#userService.getUser(id);
    res.send(users);
  }
}

module.exports = createController(UserController)
  .prefix(AppConstants.apiRoute + "/user")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
  .get("/", "list")
  .get("/:id", "get");
