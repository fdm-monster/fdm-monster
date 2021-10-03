const { createController } = require("awilix-express");
const passport = require("passport");
const Logger = require("../handlers/logger.js");
const { NotImplementedException } = require("../exceptions/runtime.exceptions");

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
  .prefix("/users")
  .before([])
  .post("/login", "login", {
    before: [
      passport.authenticate("local", {
        // Dont add or we wont reach remember_me cookie successRedirect: "/dashboard",
        failureRedirect: "/users/login",
        failureFlash: true
      })
    ],
    after: [(req, res) => res.redirect("/dashboard")]
  })
  .get("/logout", "logout");
