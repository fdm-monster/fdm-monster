const { createController } = require("awilix-express");
const passport = require("passport");
const Logger = require("../handlers/logger.js");
const { NotImplementedException } = require("../exceptions/runtime.exceptions");
const { AppConstants } = require("../server.constants");
const User = require("../models/Auth/User");
const bcrypt = require("bcryptjs");

class AuthController {
  #settingsStore;
  #userTokenService;

  #logger = new Logger("Server-API");

  constructor({ settingsStore, userTokenService }) {
    this.#settingsStore = settingsStore;
    this.#userTokenService = userTokenService;
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
    const { name, username, password, password2 } = req.body;
    const errors = [];

    let settings = this.#settingsStore.getServerSettings();

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
