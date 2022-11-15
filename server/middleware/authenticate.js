const { inject } = require("awilix-express");
const { AuthorizationError, AuthenticationError } = require("../exceptions/runtime.exceptions");
const { asValue } = require("awilix");
const { serverSettingKey } = require("../constants/server-settings.constants");

function authorizePermission(permission) {
  return inject(({ permissionService, roleService }) => async (req, res, next) => {
    if (!req.roles?.length) {
      throw new AuthorizationError(permission);
    }

    const assignedPermissions = roleService.getRolesPermissions(req.roles);
    if (!permissionService.authorizePermission(permission, assignedPermissions)) {
      throw new AuthorizationError(permission);
    }

    next();
  });
}

module.exports = {
  validateWhitelistedIp: inject(({ settingsStore, loggerFactory }) => async (req, res, next) => {
    const logger = loggerFactory("validateWhitelistedIp");
    const serverSettings = settingsStore.getServerSettings();
    if (
      (serverSettings && !serverSettings[serverSettingKey]) ||
      serverSettings[serverSettingKey]?.whitelistEnabled
    ) {
      next();
    }

    const whitelist = serverSettings[serverSettingKey].whitelistedIpAddresses;
    const ipAddress = req.connection.remoteAddress;
    // Empty whitelist is treated as disabled as well
    if (whitelist?.length && !whitelist.includes(ipAddress)) {
      logger.error("IP was not whitelisted ", req.connection.remoteAddress);
      const err = new Error("Bad IP: " + req.connection.remoteAddress);
      next(err);
    }

    next();
  }),
  authenticate: () =>
    inject(({ settingsStore }) => async (req, res, next) => {
      const serverSettings = settingsStore.getServerSettings();

      if (serverSettings && !serverSettings[serverSettingKey]?.loginRequired) {
        return next();
      }
      if (req.isAuthenticated()) {
        return next();
      }

      throw new AuthenticationError("Not authenticated", 401);
    }),
  authorizeRoles: (roles, subset = true) =>
    inject(({ roleService }) => async (req, res, next) => {
      if (!roleService.authorizeRoles(roles, req.roles, subset)) {
        throw new AuthorizationError(roles);
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
