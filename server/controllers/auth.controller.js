const { createController } = require("awilix-express");
const { InternalServerException, BadRequestException } = require("../exceptions/runtime.exceptions");
const { AppConstants } = require("../server.constants");
const { validateMiddleware } = require("../handlers/validators");
const { registerUserRules } = require("./validation/user-controller.validation");
const { logoutRefreshTokenRules } = require("./validation/auth-controller.validation");
const { authenticate } = require("../middleware/authenticate");

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

  async getLoginRequired(req, res) {
    const isLoginRequired = await this.settingsStore.getLoginRequired();
    return res.send({ loginRequired: isLoginRequired });
  }

  async verifyLogin(req, res) {
    return res.send({ success: true });
  }

  async needsPasswordChange(req, res) {
    const isLoginRequired = this.settingsStore.getLoginRequired();
    if (!isLoginRequired) {
      return res.send({ loginRequired: isLoginRequired, needsPasswordChange: false, authenticated: true });
    }
    if (req.isAuthenticated()) {
      return res.send({
        loginRequired: isLoginRequired,
        needsPasswordChange: req.user?.needsPasswordChange,
        authenticated: true,
      });
    }
    return res.send({ loginRequired: isLoginRequired, authenticated: false });
  }

  async refreshLogin(req, res) {
    const { refreshToken } = await validateMiddleware(req, logoutRefreshTokenRules);

    this.logger.log(`Refresh login attempt from IP ${req.ip} and user-agent ${req.headers["user-agent"]}`);
    const idToken = await this.authService.renewLoginByRefreshToken(refreshToken);
    return res.send({ token: idToken });
  }

  async logout(req, res) {
    const isLoginRequired = await this.settingsStore.getLoginRequired();
    if (!isLoginRequired) {
      return res.end();
    }

    const userId = req.user.id;
    await this.authService.logoutUserId(userId);
    res.end();
  }

  async register(req, res) {
    let registrationEnabled = this.settingsStore.isRegistrationEnabled();
    if (!registrationEnabled) {
      throw new BadRequestException("Registration is disabled. Cant register user");
    }
    const { username, password } = await validateMiddleware(req, registerUserRules);

    const roles = await this.roleService.getAppDefaultRolesId();
    const result = await this.userService.register({ username, password, roles });
    res.send(result);
  }
}

module.exports = createController(AuthController)
  .prefix(AppConstants.apiRoute + "/auth")
  .post("/register", "register")
  .post("/login", "login")
  .get("/login-required", "getLoginRequired")
  .post("/needs-password-change", "needsPasswordChange")
  .post("/refresh", "refreshLogin")
  .post("/verify", "verifyLogin", {
    before: [authenticate()],
  })
  .post("/logout", "logout", {
    before: [authenticate()],
  });
