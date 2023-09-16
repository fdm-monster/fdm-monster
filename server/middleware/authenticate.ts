import { inject } from "awilix-express";
import { AuthenticationError, AuthorizationError } from "@/exceptions/runtime.exceptions";

export function authorizePermission(permission: string) {
  return inject(({ permissionService, roleService }) => async (req, res, next) => {
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
  inject(({ settingsStore, authService }) => async (req, res, next) => {
    const isLoginRequired = await settingsStore.getLoginRequired();
    if (!isLoginRequired) {
      return next();
    }

    // Check if a password change is required
    if (req.user?.needsPasswordChange) {
      throw new AuthenticationError("Password change required", 401);
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
export const authorizeRoles = (roles, subset = true) =>
  inject(({ roleService }) => async (req, res, next) => {
    if (!roleService.authorizeRoles(roles, req.roles, subset)) {
      throw new AuthorizationError({ roles });
    }

    next();
  });

export function withPermission(permission) {
  return {
    before: [authorizePermission(permission)],
  };
}
