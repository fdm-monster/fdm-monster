import { inject } from "awilix-express";
import { AuthenticationError, AuthorizationError, PasswordChangeRequiredError } from "@/exceptions/runtime.exceptions";
import { NextFunction, Request, Response } from "express";

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
      throw new PasswordChangeRequiredError();
    }

    // Check if a logout was called
    const isJwtBlacklisted = await authService.isBlacklisted(req.user?.id);
    if (isJwtBlacklisted) {
      throw new AuthenticationError("Not authenticated", 401);
    }

    if (req.isAuthenticated()) {
      return next();
    }

    throw new AuthenticationError("Not authenticated", 401);
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
