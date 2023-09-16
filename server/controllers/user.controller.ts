const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { InternalServerException } = require("../exceptions/runtime.exceptions");

export class UserController {
  /**
   * @type {UserService}
   */
  userService;
  /**
   * @type {ConfigService}
   */
  configService;

  constructor({ userService, configService }) {
    this.userService = userService;
    this.configService = configService;
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
    this.throwIfDemoMode();

    const { id } = await validateInput(req.params, idRules);

    if (this.isDemoMode()) {
      const demoUserId = await this.userService.getDemoUserId();
      if (id === demoUserId) {
        this.throwIfDemoMode();
      }
    }

    await this.userService.deleteUser(id);
    res.send();
  }

  async get(req, res) {
    const { id } = await validateInput(req.params, idRules);
    const users = await this.userService.getUser(id);
    res.send(users);
  }

  async changeUsername(req, res) {
    this.throwIfDemoMode();

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
    this.throwIfDemoMode();

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

  isDemoMode() {
    return this.configService.get(AppConstants.OVERRIDE_IS_DEMO_MODE, "false") === "true";
  }

  throwIfDemoMode() {
    const isDemoMode = this.isDemoMode();
    if (isDemoMode) {
      throw new InternalServerException("Not allowed in demo mode");
    }
  }
}

export default createController(UserController)
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
