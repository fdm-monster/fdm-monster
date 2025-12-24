import { inject } from "awilix-express";
import { AuthenticationError, AuthorizationError } from "@/exceptions/runtime.exceptions";
import { NextFunction, Request, Response } from "express";
import { AUTH_ERROR_REASON, PermissionName, RoleName } from "@/constants/authorization.constants";
import { SettingsStore } from "@/state/settings.store";
import { AuthService } from "@/services/authentication/auth.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { IPermissionService } from "@/services/interfaces/permission.service.interface";

export const authenticate = () =>
  inject(
    (authService: AuthService, loggerFactory: ILoggerFactory, settingsStore: SettingsStore) =>
      async (req: Request, res: Response, next: NextFunction) => {
        const logger = loggerFactory("Middleware:authenticate");

        const isLoginRequired = await settingsStore.getLoginRequired();
        if (!isLoginRequired) {
          return next();
        }

        // Check if a password change is required
        if (req.user?.needsPasswordChange) {
          throw new AuthenticationError("Password change required", AUTH_ERROR_REASON.PasswordChangeRequired);
        }

        // Check if a logout was called
        const bearer = req.headers.authorization?.replace("Bearer ", "") || undefined;
        if (!!bearer?.length && authService.isJwtTokenBlacklisted(bearer)) {
          throw new AuthenticationError("Not authenticated", AUTH_ERROR_REASON.LoginRequired);
        }

        if (req.isAuthenticated()) {
          return next();
        }

        logger.log(`Not authenticated for route: ${req.originalUrl}`);
        throw new AuthenticationError("Not authenticated", AUTH_ERROR_REASON.InvalidOrExpiredAuthToken);
      },
  );

export function permission(requiredPermission: PermissionName) {
  return inject(
    (permissionService: IPermissionService, roleService: IRoleService) =>
      async (req: Request, _res: Response, next: NextFunction) => {
        const userRoles = req.roles;
        if (!userRoles?.length) {
          throw new AuthorizationError({ permissions: [requiredPermission] });
        }

        const assignedPermissions = roleService.getRolesPermissions(userRoles);
        if (!permissionService.authorizePermission(requiredPermission, assignedPermissions)) {
          throw new AuthorizationError({ permissions: [requiredPermission] });
        }

        next();
      },
  );
}

export const authorizeRoles = (requiredRoles: RoleName[], subset = true) =>
  inject((roleService: IRoleService) => async (req: Request, res: Response, next: NextFunction) => {
    if (!req.roles?.length || !roleService.authorizeRoles(requiredRoles, req.roles, subset)) {
      throw new AuthorizationError({ roles: requiredRoles });
    }

    next();
  });
