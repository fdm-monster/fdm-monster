const { createController } = require("awilix-express");
const passport = require("passport");
const { InternalServerException } = require("../exceptions/runtime.exceptions");
const { AppConstants } = require("../server.constants");
const { validateMiddleware } = require("../handlers/validators");
const { registerUserRules } = require("./validation/user-controller.validation");

class AuthController {
  #settingsStore;
  #userTokenService;
  #userService;
  #roleService;

  #logger;

  constructor({ settingsStore, userTokenService, userService, roleService, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#userTokenService = userTokenService;
    this.#userService = userService;
    this.#roleService = roleService;
    this.#logger = loggerFactory("Server-API");
  }

  async login(req, res) {
    if (req.body.remember_me) {
      const token = await this.#userTokenService.issueTokenWithDone(req.user);
      res.cookie("remember_me", token, {
        path: "/",
        httpOnly: true,
        maxAge: 604800000
      });
    }

    return res.send();
  }

  logout(req, res) {
    req.logout();

    res.end();
  }

  async register(req, res) {
    let registrationEnabled = this.#settingsStore.isRegistrationEnabled();
    if (!registrationEnabled) {
      throw new InternalServerException("Registration is disabled. Cant register user");
    }
    const { name, username, password } = await validateMiddleware(req, registerUserRules);

    const roles = [this.#roleService.getDefaultRole()];
    const result = await this.#userService.register({ name, username, password, roles });

    res.send(result);
  }
}

module.exports = createController(AuthController)
  .prefix(AppConstants.apiRoute + "/auth")
  .post("/register", "register")
  .post("/login", "login", {
    before: [passport.authenticate("local")]
  })
  .post("/logout", "logout");
