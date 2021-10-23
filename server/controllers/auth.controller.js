const { createController } = require("awilix-express");
const passport = require("passport");
const Logger = require("../handlers/logger.js");
const { NotImplementedException } = require("../exceptions/runtime.exceptions");
const { AppConstants } = require("../server.constants");

class AuthController {
  #settingsStore;
  #userTokenService;

  #logger = new Logger("Server-API");

  constructor({ settingsStore, userTokenService }) {
    this.#settingsStore = settingsStore;
    this.#userTokenService = userTokenService;
  }

  async login(req, res, next) {
    if (!req.body.remember_me) {
      return next();
    }

    await this.#userTokenService.issueTokenWithDone(req.user, function (err, token) {
      if (err) {
        return next(err);
      }
      res.cookie("remember_me", token, {
        path: "/",
        httpOnly: true,
        maxAge: 604800000
      });
      return next();
    });
  }

  logout(req, res) {
    req.logout();
  }

  async register(req, res) {
    const { name, username, password, password2 } = req.body;
    const errors = [];

    let settings = this.#settingsStore.getServerSettings();

    throw new NotImplementedException("Registration is now implemented");
  }
}

module.exports = createController(AuthController)
  .prefix(AppConstants.apiRoute + "/users")
  .post("/login", "login", {
    before: [passport.authenticate("local")]
  })
  .get("/logout", "logout");
