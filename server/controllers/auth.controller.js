const { createController } = require("awilix-express");
const { InternalServerException } = require("../exceptions/runtime.exceptions");
const { AppConstants } = require("../server.constants");
const { validateMiddleware } = require("../handlers/validators");
const { registerUserRules } = require("./validation/user-controller.validation");

class AuthController {
  /**
   * @type {AuthService}
   */
  authService;
  /**
   * @type {SettingsStore}
   */
  settingsStore;
  /**
   * @type {UserService}
   */
  userService;
  /**
   * @type {RoleService}
   */
  roleService;

  logger;

  constructor({ authService, settingsStore, userService, roleService, loggerFactory }) {
    this.authService = authService;
    this.settingsStore = settingsStore;
    this.userService = userService;
    this.roleService = roleService;
    this.logger = loggerFactory(AuthController.name);
  }

  async login(req, res) {
    this.logger.log(`Login attempt from IP ${req.ip} and user-agent ${req.headers["user-agent"]}`);
    const tokens = await this.authService.loginUser(req.body.username, req.body.password);
    return res.send(tokens);
  }

  async refreshLogin(req, res) {
    this.logger.log(`Refresh login attempt from IP ${req.ip} and user-agent ${req.headers["user-agent"]}`);
    const idToken = await this.authService.renewLoginByRefreshToken(req.body.refreshToken);
    return res.send({ token: idToken });
  }

  async logoutRefreshToken(req, res) {
    const refreshToken = req.body.refreshToken;
    await this.authService.logoutUserRefreshToken(refreshToken);
    res.end();
  }

  async register(req, res) {
    let registrationEnabled = this.settingsStore.isRegistrationEnabled();
    if (!registrationEnabled) {
      throw new InternalServerException("Registration is disabled. Cant register user");
    }
    const { name, username, password } = await validateMiddleware(req, registerUserRules);

    const roles = await this.roleService.getDefaultRolesId();
    const result = await this.userService.register({ name, username, password, roles });

    res.send(result);
  }
}

module.exports = createController(AuthController)
  .prefix(AppConstants.apiRoute + "/auth")
  .post("/register", "register")
  .post("/login", "login")
  .post("/refresh", "refreshLogin")
  .post("/logout-refresh-token", "logoutRefreshToken");
