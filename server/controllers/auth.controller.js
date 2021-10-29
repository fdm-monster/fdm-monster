const { createController } = require("awilix-express");
const passport = require("passport");
const { NotImplementedException, InternalServerException } = require("../exceptions/runtime.exceptions");
const { AppConstants } = require("../server.constants");
const { validateMiddleware } = require("../handlers/validators");
const { registerUserRules } = require("./validation/user-controller.validation");

class AuthController {
  #settingsStore;
  #userTokenService;
  #userService;

  #logger;

  constructor({ settingsStore, userTokenService, userService, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#userTokenService = userTokenService;
    this.#userService = userService;
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
    let registrationEnabled = this.#settingsStore.isUserRegistrationEnabled();
    if (!registrationEnabled) {
      throw new InternalServerException("Registration is disabled. Cant register user");
    }

    const { name, username, password } = await validateMiddleware(req, registerUserRules);
    this.#userService.register({ name, username, password });
    throw new NotImplementedException("Registration is now implemented");
  }
}

module.exports = createController(AuthController)
  .prefix(AppConstants.apiRoute + "/users")
  .post("/create-test", "createTest")
  .post("/login", "login", {
    before: [passport.authenticate("local")]
  })
  .post("/logout", "logout");
