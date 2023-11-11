import { inject } from "awilix-express";
import { AuthenticationError, AuthorizationError } from "@/exceptions/runtime.exceptions";
import { NextFunction, Request, Response } from "express";
import { AUTH_ERROR_REASON } from "@/constants/authorization.constants";
import { SettingsStore } from "@/state/settings.store";
import { AuthService } from "@/services/authentication/auth.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { IPermissionService } from "@/services/interfaces/permission.service.interface";
import { IdType } from "@/shared.constants";

export const authenticate = () =>
  inject(
    ({
        settingsStore,
        authService,
        loggerFactory,
      }: {
        settingsStore: SettingsStore;
        authService: AuthService;
        loggerFactory: ILoggerFactory;
      }) =>
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
        const isJwtBlacklisted = authService.isJwtTokenBlacklisted(bearer);
        if (!!bearer?.length && isJwtBlacklisted) {
          throw new AuthenticationError("Not authenticated", AUTH_ERROR_REASON.LoginRequired);
        }

        if (req.isAuthenticated()) {
          return next();
        }

        logger.log(`Not authenticated for route: ${req.originalUrl}`);
        throw new AuthenticationError("Not authenticated", AUTH_ERROR_REASON.InvalidOrExpiredAuthToken);
      }
  );

export function authorizePermission(permission: string) {
  return inject(
    ({ permissionService, roleService }: { permissionService: IPermissionService; roleService: IRoleService }) =>
      async (req: Request, res: Response, next: NextFunction) => {
        const userRoles = req.roles as IdType[];
        if (!userRoles?.length) {
          throw new AuthorizationError({ permissions: [permission] });
        }

        const assignedPermissions = roleService.getRolesPermissions(userRoles);
        if (!permissionService.authorizePermission(permission, assignedPermissions)) {
          throw new AuthorizationError({ permissions: [permission] });
        }

        next();
      }
  );
}

export const authorizeRoles = (roles: string[], subset = true) =>
  inject(({ roleService }: { roleService: IRoleService }) => async (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.roles as IdType[];
    if (!roleService.authorizeRoles(roles, userRoles, subset)) {
      throw new AuthorizationError({ roles });
    }

    next();
  });

export function withPermission(permission: string) {
  return {
    before: [authorizePermission(permission)],
  };
}
