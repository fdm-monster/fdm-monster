const { inject } = require("awilix-express");
const { serverSettingKey } = require("../constants/server-settings.constants");
const { AuthenticationError } = require("../exceptions/runtime.exceptions");

module.exports = {
  validateWhitelistedIp: inject(({ settingsStore, loggerFactory }) => async (req, res, next) => {
    const logger = loggerFactory("validateWhitelistedIp");
    const serverSettings = settingsStore.getSettings();
    if (
      (!serverSettings && !serverSettings[serverSettingKey]) ||
      !serverSettings[serverSettingKey]?.whitelistEnabled
    ) {
      next();
      return;
    }

    const whitelist = serverSettings[serverSettingKey].whitelistedIpAddresses;
    const ipAddress = req.connection.remoteAddress;
    // Empty whitelist is treated as disabled as well
    // Both ::ffff:127.0.0.1 and 127.0.0.1 will be accepted
    if (whitelist?.length && !whitelist.includes(ipAddress) && ipAddress !== "::ffff:127.0.0.1") {
      // Direct comparison did not pass - now parse wildcard subnets
      const subnextMatched = whitelist.find((w) => {
        return ipAddress.startsWith(w);
      });

      if (!subnextMatched) {
        logger.error("IP did not match whitelist filters", req.connection.remoteAddress);
        throw new AuthenticationError("Bad IP: " + req.connection.remoteAddress);
      }
    }

    next();
  }),
  interceptRoles: inject(({ settingsStore, roleService }) => async (req, res, next) => {
    const serverSettings = settingsStore.getSettings();

    req.roles = req.user?.roles;
    if (serverSettings && !serverSettings[serverSettingKey]?.loginRequired && !req.user) {
      req.roles = [roleService.getDefaultRole()];
    }

    next();
  }),
};
