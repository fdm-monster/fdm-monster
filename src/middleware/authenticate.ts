import { inject } from "awilix-express";
import { AuthenticationError, AuthorizationError, PasswordChangeRequiredError } from "@/exceptions/runtime.exceptions";
import { NextFunction, Request, Response } from "express";
import { AUTH_ERROR_REASON } from "@/constants/authorization.constants";

export function authorizePermission(permission: string) {
  return inject(({ permissionService, roleService }) => async (req: Request, res: Response, next: NextFunction) => {
    if (!req.roles?.length) {
      throw new AuthorizationError({ permissions: [permission] });
    }

    const assignedPermissions = roleService.getRolesPermissions(req.roles);
    if (!permissionService.authorizePermission(permission, assignedPermissions)) {
      throw new AuthorizationError({ permissions: [permission] });
    }

    next();
  });
}

export const authenticate = () =>
  inject(({ settingsStore, authService }) => async (req: Request, res: Response, next: NextFunction) => {
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

    throw new AuthenticationError("Not authenticated", AUTH_ERROR_REASON.LoginRequired);
  });
export const authorizeRoles = (roles: string[], subset = true) =>
  inject(({ roleService }) => async (req: Request, res: Response, next: NextFunction) => {
    if (!roleService.authorizeRoles(roles, req.roles, subset)) {
      throw new AuthorizationError({ roles });
    }

    next();
  });

export function withPermission(permission: string) {
  return {
    before: [authorizePermission(permission)],
  };
}
