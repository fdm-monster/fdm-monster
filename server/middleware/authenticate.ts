const { inject } = require("awilix-express");
const { AuthorizationError, AuthenticationError } = require("../exceptions/runtime.exceptions");

function authorizePermission(permission) {
  return inject(({ permissionService, roleService }) => async (req, res, next) => {
    if (!req.roles?.length) {
      throw new AuthorizationError(permission);
    }

    const assignedPermissions = roleService.getRolesPermissions(req.roles);
    if (!permissionService.authorizePermission(permission, assignedPermissions)) {
      throw new AuthorizationError({ permission });
    }

    next();
  });
}

module.exports = {
  authenticate: () =>
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
    }),
  authorizeRoles: (roles, subset = true) =>
    inject(({ roleService }) => async (req, res, next) => {
      if (!roleService.authorizeRoles(roles, req.roles, subset)) {
        throw new AuthorizationError({ roles });
      }

      next();
    }),
  authorizePermission,
  withPermission(permission) {
    return {
      before: [authorizePermission(permission)],
    };
  },
};
