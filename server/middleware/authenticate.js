const { inject } = require("awilix-express");
const { AuthorizationError, AuthenticationError } = require("../exceptions/runtime.exceptions");

module.exports = {
  authenticate: () =>
    inject(({ settingsStore }) => async (req, res, next) => {
      const serverSettings = settingsStore.getServerSettings();

      if (!serverSettings?.server?.loginRequired) {
        return next();
      }
      if (req.isAuthenticated()) {
        return next();
      }

      throw new AuthenticationError("Not authenticated", 401);
    }),
  authorizeRoles(roles, subset = true) {
    return inject(({ settingsStore, roleService }) => async (req, res, next) => {
      const serverSettings = settingsStore.getServerSettings();
      if (!serverSettings?.server?.loginRequired && !req.roles) {
        req.roles = await roleService.getDefaultRoles();
      }

      if (!roleService.authorizeRoles(roles, req.roles, subset)) {
        throw new AuthorizationError(roles);
      }

      next();
    });
  },
  authorizePermissions(permissionArray) {
    return inject(({ settingsStore, roleService }) => async (req, res, next) => {
      console.log("asd", req.user, permissionArray, req.roles);

      next();
    });
  }
};
