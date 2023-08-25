const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");

class UserController {
  /**
   * @type {UserService}
   */
  userService;

  constructor({ userService }) {
    this.userService = userService;
  }

  async profile(req, res) {
    const user = await this.userService.getUser(req.user.id);
    res.send(user);
  }

  async list(req, res) {
    const users = await this.userService.listUsers();
    res.send(users);
  }

  async delete(req, res) {
    const { id } = await validateInput(req.params, idRules);
    await this.userService.deleteUser(id);
    res.send();
  }

  async get(req, res) {
    const { id } = await validateInput(req.params, idRules);
    const users = await this.userService.getUser(id);
    res.send(users);
  }
}

module.exports = createController(UserController)
  .prefix(AppConstants.apiRoute + "/user")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
  .get("/", "list")
  .get("/profile", "profile")
  .get("/:id", "get")
  .delete("/:id", "delete");
