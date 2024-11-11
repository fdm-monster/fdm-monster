import { injectable, inject } from "awilix";
import { Request, Response } from "express";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import { idRulesV2 } from "./validation/generic.validation";
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

@route(AppConstants.apiRoute + "/user")
@before([authenticate()])
export class UserController {
  userService: IUserService;
  roleService: IRoleService;
  configService: IConfigService;
  authService: IAuthService;
  settingsStore: SettingsStore;
  logger: LoggerService;
  isTypeormMode: boolean;

  constructor({
    userService,
    configService,
    roleService,
    settingsStore,
    authService,
    loggerFactory,
    isTypeormMode,
  }: {
    userService: IUserService;
    configService: IConfigService;
    roleService: IRoleService;
    authService: IAuthService;
    settingsStore: SettingsStore;
    loggerFactory: ILoggerFactory;
    isTypeormMode: boolean;
  }) {
    this.userService = userService;
    this.configService = configService;
    this.roleService = roleService;
    this.authService = authService;
    this.settingsStore = settingsStore;
    this.isTypeormMode = isTypeormMode;
    this.logger = loggerFactory(UserController.name);
  }

  @GET()
  @route("/")
  @before([authorizeRoles([ROLES.ADMIN])])
  async list(req: Request, res: Response) {
    const users = await this.userService.listUsers();
    res.send(users.map((u) => this.userService.toDto(u)));
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
  @before([authorizeRoles([ROLES.ADMIN])])
  async get(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const user = await this.userService.getUser(id);
    res.send(this.userService.toDto(user));
  }

  @DELETE()
  @route("/:id")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async delete(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    const ownUserId = req.user?.id;
    if (ownUserId == id) {
      throw new ForbiddenError("Not allowed to delete own account");
    }

    const isRootUser = await this.userService.isUserRootUser(id);
    if (isRootUser) {
      throw new ForbiddenError("Not allowed to delete root user");
    }

    if (this.configService.isDemoMode()) {
      const demoUserId = await this.userService.getDemoUserId();
      if (id === demoUserId) {
        this.throwIfDemoMode();
      }
    }

    await this.userService.deleteUser(id);

    try {
      await this.authService.logoutUserId(id);
    } catch (e) {
      this.logger.error(errorSummary(e));
    }

    res.send();
  }

  @POST()
  @route("/:id/change-username")
  @before([demoUserNotAllowed])
  async changeUsername(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    if (req.user?.id != id && (await this.settingsStore.getLoginRequired())) {
      throw new ForbiddenError("Not allowed to change username of other users");
    }

    const { username } = await validateInput(req.body, {
      username: "required|string",
    });
    await this.userService.updateUsernameById(id, username);
    res.send();
  }

  @POST()
  @route("/:id/change-password")
  @before([demoUserNotAllowed])
  async changePassword(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    if (req.user?.id != id && (await this.settingsStore.getLoginRequired())) {
      throw new ForbiddenError("Not allowed to change password of other users");
    }

    const { oldPassword, newPassword } = await validateInput(req.body, {
      oldPassword: "required|string",
      newPassword: "required|string",
    });
    await this.userService.updatePasswordById(id, oldPassword, newPassword);
    res.send();
  }

  @POST()
  @route("/:id/set-user-roles")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async setUserRoles(req: Request, res: Response) {
    const { id: currentUserId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    const ownUserId = req.user?.id;
    const ownUser = await this.userService.getUser(ownUserId);
    const ownUserRoles = ownUser.roles;
    const adminRole = await this.roleService.getSynchronizedRoleByName(ROLES.ADMIN);

    if (ownUserId == currentUserId && !ownUserRoles.includes(adminRole.id) && !ownUser.isRootUser) {
      throw new ForbiddenError("Only an ADMIN or OWNER user is allowed to change its own roles");
    }

    const { roleIds } = await validateInput(req.body, {
      roleIds: "array",
      "roleIds.*": "alphaNumeric",
    });

    if (ownUserId == currentUserId && !roleIds.includes(adminRole.id)) {
      if (ownUser.isRootUser) {
        throw new BadRequestException("It does not make sense to remove ADMIN role from an OWNER user.");
      } else {
        throw new BadRequestException("An ADMIN user cannot remove its ADMIN role.");
      }
    }

    await this.userService.setUserRoleIds(currentUserId, roleIds);
    res.send();
  }

  @POST()
  @route("/:id/set-verified")
  @before([authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  async setVerified(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    const ownUserId = req.user?.id;
    if (ownUserId == id) {
      throw new ForbiddenError("Not allowed to change own verified status");
    }

    const isRootUser = await this.userService.isUserRootUser(id);
    if (isRootUser) {
      throw new ForbiddenError("Not allowed to change root user to unverified");
    }

    const { isVerified } = await validateInput(req.body, {
      isVerified: "required|boolean",
    });
    await this.userService.setVerifiedById(id, isVerified);

    res.send();
  }

  @POST()
  @route("/:id/set-root-user")
  @before([demoUserNotAllowed])
  async setRootUser(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    const userId = req.user?.id;
    if (req.user?.id) {
      const isRootUser = await this.userService.isUserRootUser(userId);
      if (!isRootUser) {
        throw new ForbiddenError("Not allowed to change owner without being owner yourself");
      }
    }
    const { isRootUser } = await validateInput(req.body, {
      isRootUser: "required|boolean",
    });
    await this.userService.setIsRootUserById(id, isRootUser);
    res.send();
  }

  throwIfDemoMode() {
    const isDemoMode = this.configService.isDemoMode();
    if (isDemoMode) {
      throw new ForbiddenError("Not allowed in demo mode");
    }
  }
}
