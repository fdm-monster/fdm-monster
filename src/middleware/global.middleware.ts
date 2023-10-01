import { inject } from "awilix-express";
import { serverSettingsKey } from "@/constants/server-settings.constants";
import { AuthenticationError } from "@/exceptions/runtime.exceptions";
import { NextFunction, Request, Response } from "express";

export const validateWhitelistedIp = inject(
  ({ settingsStore, loggerFactory }) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const logger = loggerFactory("validateWhitelistedIp");
      const serverSettings = settingsStore.getSettings();
      if ((!serverSettings && !serverSettings[serverSettingsKey]) || !serverSettings[serverSettingsKey]?.whitelistEnabled) {
        next();
        return;
      }

      const whitelist = serverSettings[serverSettingsKey].whitelistedIpAddresses;
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
    }
);

export const interceptRoles = inject(({ settingsStore, roleService }) => async (req, res, next) => {
  const serverSettings = await settingsStore.getSettings();

  req.roles = req.user?.roles;

  // If server settings are not set, we can't determine the default role
  if (serverSettings && !req.user) {
    const roleName = await roleService.getAppDefaultRole();
    req.roles = [roleName];
  }

  next();
});
