import { createController } from "awilix-express";
import { BadRequestException } from "@/exceptions/runtime.exceptions";
import { AppConstants } from "@/server.constants";
import { validateMiddleware } from "@/handlers/validators";
import { registerUserRules } from "./validation/user-controller.validation";
import { refreshTokenRules } from "./validation/auth-controller.validation";
import { authenticate } from "@/middleware/authenticate";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { Request, Response } from "express";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { IAuthService } from "@/services/interfaces/auth.service.interface";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { demoUserNotAllowedInterceptor } from "@/middleware/demo.middleware";

export class AuthController {
  authService: IAuthService;
  settingsStore: SettingsStore;
  userService: IUserService;
  roleService: IRoleService;
  logger: LoggerService;

  constructor({
    authService,
    settingsStore,
    userService,
    roleService,
    loggerFactory,
  }: {
    authService: IAuthService;
    settingsStore: SettingsStore;
    userService: IUserService;
    roleService: IRoleService;
    loggerFactory: ILoggerFactory;
  }) {
    this.authService = authService;
    this.settingsStore = settingsStore;
    this.userService = userService;
    this.roleService = roleService;
    this.logger = loggerFactory(AuthController.name);
  }

  async login(req: Request, res: Response) {
    this.logger.log(`Login attempt from IP ${req.ip} and user-agent ${req.headers["user-agent"]}`);
    const tokens = await this.authService.loginUser(req.body.username, req.body.password);
    return res.send(tokens);
  }

  async getLoginRequired(req: Request, res: Response) {
    const isLoginRequired = await this.settingsStore.getLoginRequired();
    const registration = this.settingsStore.isRegistrationEnabled();
    const wizardState = this.settingsStore.getWizardState();
    return res.send({ loginRequired: isLoginRequired, registration, wizardState });
  }

  async verifyLogin(req: Request, res: Response) {
    return res.send({ success: true });
  }

  async needsPasswordChange(req: Request, res: Response) {
    const registration = this.settingsStore.isRegistrationEnabled();
    const isLoginRequired = await this.settingsStore.getLoginRequired();
    if (!isLoginRequired) {
      return res.send({ loginRequired: isLoginRequired, registration, needsPasswordChange: false, authenticated: true });
    }

    if (req.isAuthenticated()) {
      return res.send({
        loginRequired: isLoginRequired,
        registration,
        needsPasswordChange: req.user?.needsPasswordChange,
        authenticated: true,
      });
    }

    return res.send({ loginRequired: isLoginRequired, needsPasswordChange: null, authenticated: false });
  }

  async refreshLogin(req: Request, res: Response) {
    const { refreshToken } = await validateMiddleware(req, refreshTokenRules);
    this.logger.log(`Refresh login attempt from IP ${req.ip} and user-agent ${req.headers["user-agent"]}`);
    const idToken = await this.authService.renewLoginByRefreshToken(refreshToken);
    return res.send({ token: idToken });
  }

  async logout(req: Request, res: Response) {
    const isLoginRequired = await this.settingsStore.getLoginRequired();
    if (!isLoginRequired) {
      return res.end();
    }

    // Get token from header
    const jwtToken = req.headers.authorization?.replace("Bearer ", "") || undefined;
    const userId = req.user.id;
    await this.authService.logoutUserId(userId, jwtToken);
    res.end();
  }

  async register(req: Request, res: Response) {
    let registrationEnabled = this.settingsStore.isRegistrationEnabled();
    if (!registrationEnabled) {
      throw new BadRequestException("Registration is disabled. Cant register user");
    }
    const { username, password } = await validateMiddleware(req, registerUserRules);
    if (username.toLowerCase().includes("admin")) {
      throw new BadRequestException("Username 'admin' is not allowed");
    }
    if (username.toLowerCase().includes("root")) {
      throw new BadRequestException("Username 'root' is not allowed");
    }
    if (username.toLowerCase() === "demo") {
      throw new BadRequestException("Username 'demo' is not allowed");
    }

    const roles = await this.roleService.getAppDefaultRoleIds();
    const result = await this.userService.register({
      username,
      password,
      roles,
      needsPasswordChange: false,
      isDemoUser: false,
      isRootUser: false,
      // An admin needs to verify the user first
      isVerified: false,
    });
    const userDto = this.userService.toDto(result);
    res.send(userDto);
  }
}

export default createController(AuthController)
  .prefix(AppConstants.apiRoute + "/auth")
  .post("/register", "register", demoUserNotAllowedInterceptor)
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
