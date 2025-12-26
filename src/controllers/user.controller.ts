import { Request, Response } from "express";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { validateInput, validateMiddleware } from "@/handlers/validators";
import { BadRequestException, ForbiddenError } from "@/exceptions/runtime.exceptions";
import { IConfigService } from "@/services/core/config.service";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { demoUserNotAllowed } from "@/middleware/demo.middleware";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { IAuthService } from "@/services/interfaces/auth.service.interface";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { errorSummary } from "@/utils/error.utils";
import { SettingsStore } from "@/state/settings.store";
import { before, DELETE, GET, POST, route } from "awilix-express";
import {
  changePasswordSchema,
  isRootUserSchema,
  isVerifiedSchema,
  registerUserWithRolesSchema,
  setUserRolesSchema,
  usernameSchema,
} from "@/controllers/validation/user-controller.validation";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(AppConstants.apiRoute + "/user")
@before([authenticate()])
export class UserController {
  logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly userService: IUserService,
    private readonly configService: IConfigService,
    private readonly roleService: IRoleService,
    private readonly authService: IAuthService,
    private readonly settingsStore: SettingsStore,
  ) {
    this.logger = loggerFactory(UserController.name);
  }

  @GET()
  @route("/")
  @before([authorizeRoles([ROLES.ADMIN])])
  async list(req: Request, res: Response) {
    const users = await this.userService.listUsers();
    res.send(users.map((u) => this.userService.toDto(u)));
  }

  @POST()
  @route("/")
  @before([authorizeRoles([ROLES.ADMIN])])
  async create(req: Request, res: Response) {
    const { username, password, roles } = await validateMiddleware(req, registerUserWithRolesSchema);
    if (
      username.toLowerCase().includes("admin") ||
      username.toLowerCase().includes("root") ||
      username.toLowerCase() === "demo"
    ) {
      throw new BadRequestException("Username is not allowed");
    }

    await this.userService.register({
      username,
      password,
      roles,
      needsPasswordChange: false,
      isDemoUser: false,
      isRootUser: false,
      // An admin needs to verify the user first
      isVerified: true,
    });
    res.send();
  }

  @GET()
  @route("/roles")
  async listRoles(req: Request, res: Response) {
    const roleDtos = this.roleService.roles.map((r) => this.roleService.toDto(r));
    res.send(roleDtos);
  }

  @GET()
  @route("/profile")
  async profile(req: Request, res: Response) {
    if (!req.user?.id) {
      res.send({});
      return;
    }

    const user = await this.userService.getUser(req.user?.id);
    res.send(this.userService.toDto(user));
  }

  @GET()
  @route("/:id")
  @before([authorizeRoles([ROLES.ADMIN]), ParamId("id")])
  async get(req: Request, res: Response) {
    const user = await this.userService.getUser(req.local.id);
    res.send(this.userService.toDto(user));
  }

  @DELETE()
  @route("/:id")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed, ParamId("id")])
  async delete(req: Request, res: Response) {
    const deletedUserId = req.local.id;
    const ownUserId = req.user?.id;
    if (ownUserId == deletedUserId) {
      throw new ForbiddenError("Not allowed to delete own account");
    }

    const isRootUser = await this.userService.isUserRootUser(deletedUserId);
    if (isRootUser) {
      throw new ForbiddenError("Not allowed to delete root user");
    }

    if (this.configService.isDemoMode()) {
      const demoUserId = await this.userService.getDemoUserId();
      if (deletedUserId === demoUserId) {
        this.throwIfDemoMode();
      }
    }

    await this.userService.deleteUser(deletedUserId);

    try {
      await this.authService.logoutUserId(deletedUserId);
    } catch (e) {
      this.logger.error(errorSummary(e));
    }

    res.send();
  }

  @POST()
  @route("/:id/change-username")
  @before([demoUserNotAllowed, ParamId("id")])
  async changeUsername(req: Request, res: Response) {
    const changedUserId = req.local.id;

    if (req.user?.id != changedUserId && (await this.settingsStore.getLoginRequired())) {
      throw new ForbiddenError("Not allowed to change username of other users");
    }

    const { username } = await validateInput(req.body, usernameSchema);
    await this.userService.updateUsernameById(changedUserId, username);
    res.send();
  }

  @POST()
  @route("/:id/change-password")
  @before([demoUserNotAllowed, ParamId("id")])
  async changePassword(req: Request, res: Response) {
    const changedUserId = req.local.id;

    if (req.user?.id != changedUserId && (await this.settingsStore.getLoginRequired())) {
      throw new ForbiddenError("Not allowed to change password of other users");
    }

    const { oldPassword, newPassword } = await validateInput(req.body, changePasswordSchema);
    await this.userService.updatePasswordById(changedUserId, oldPassword, newPassword);
    res.send();
  }

  @POST()
  @route("/:id/set-user-roles")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed, ParamId("id")])
  async setUserRoles(req: Request, res: Response) {
    const changedUserId = req.local.id;

    const ownUserId = req.user?.id;
    if (!ownUserId) {
      throw new ForbiddenError("Need to be logged in, in order to set user roles");
    }

    const ownUser = await this.userService.getUser(ownUserId);
    const mappedUser = this.userService.toDto(ownUser);

    const ownUserRoles = mappedUser.roles;

    if (ownUserId == changedUserId && !ownUserRoles.includes(ROLES.ADMIN) && !mappedUser.isRootUser) {
      throw new ForbiddenError("Only an ADMIN or OWNER user is allowed to change its own roles");
    }

    const { roles } = await validateInput(req.body, setUserRolesSchema);

    if (ownUserId == changedUserId && !roles.includes(ROLES.ADMIN)) {
      if (mappedUser.isRootUser) {
        throw new BadRequestException("It does not make sense to remove ADMIN role from an OWNER user.");
      } else {
        throw new BadRequestException("An ADMIN user cannot remove its ADMIN role.");
      }
    }

    await this.userService.setUserRoles(changedUserId, roles);
    res.send();
  }

  @POST()
  @route("/:id/set-verified")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed, ParamId("id")])
  async setVerified(req: Request, res: Response) {
    const changedUserId = req.local.id;

    const ownUserId = req.user?.id;
    if (ownUserId == changedUserId) {
      throw new ForbiddenError("Not allowed to change own verified status");
    }

    const isRootUser = await this.userService.isUserRootUser(changedUserId);
    if (isRootUser) {
      throw new ForbiddenError("Not allowed to change root user to unverified");
    }

    const { isVerified } = await validateInput(req.body, isVerifiedSchema);
    await this.userService.setVerifiedById(changedUserId, isVerified);

    res.send();
  }

  @POST()
  @route("/:id/set-root-user")
  @before([demoUserNotAllowed, ParamId("id")])
  async setRootUser(req: Request, res: Response) {
    const changedUserId = req.local.id;

    const userId = req.user?.id;
    if (userId) {
      const isRootUser = await this.userService.isUserRootUser(userId);
      if (!isRootUser) {
        throw new ForbiddenError("Not allowed to change owner without being owner yourself");
      }
    }
    const { isRootUser } = await validateInput(req.body, isRootUserSchema);
    await this.userService.setIsRootUserById(changedUserId, isRootUser);
    res.send();
  }

  throwIfDemoMode() {
    const isDemoMode = this.configService.isDemoMode();
    if (isDemoMode) {
      throw new ForbiddenError("Not allowed in demo mode");
    }
  }
}
