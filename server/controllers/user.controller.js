const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { InternalServerException } = require("../exceptions/runtime.exceptions");

class UserController {
  /**
   * @type {UserService}
   */
  userService;

  constructor({ userService }) {
    this.userService = userService;
  }

  async profile(req, res) {
    if (!req.user?.id) {
      res.send({});
      return;
    }

    const user = await this.userService.getUser(req.user?.id);
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

  async changeUsername(req, res) {
    const { id } = await validateInput(req.params, idRules);

    if (req.user?.id !== id) {
      throw new InternalServerException("Not allowed to change username of other users");
    }

    const { username } = await validateInput(req.body, {
      username: "required|string",
    });
    await this.userService.updateUsernameById(id, username);
    res.send();
  }

  async changePassword(req, res) {
    const { id } = await validateInput(req.params, idRules);

    if (req.user?.id !== id) {
      throw new InternalServerException("Not allowed to change password of other users");
    }

    const { oldPassword, newPassword } = await validateInput(req.body, {
      oldPassword: "required|string",
      newPassword: "required|string",
    });
    await this.userService.updatePasswordById(id, oldPassword, newPassword);
    res.send();
  }
}

module.exports = createController(UserController)
  .prefix(AppConstants.apiRoute + "/user")
  .before([authenticate()])
  .get("/", "list", {
    before: [authorizeRoles([ROLES.ADMIN])],
  })
  .get("/:id", "get", {
    before: [authorizeRoles([ROLES.ADMIN])],
  })
  .delete("/:id", "delete", {
    before: [authorizeRoles([ROLES.ADMIN])],
  })
  .get("/profile", "profile")
  .post("/:id/change-username", "changeUsername")
  .post("/:id/change-password", "changePassword");
