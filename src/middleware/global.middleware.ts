import { inject } from "awilix-express";
import { serverSettingsKey } from "@/constants/server-settings.constants";
import { ForbiddenError } from "@/exceptions/runtime.exceptions";
import { NextFunction, Request, Response } from "express";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";

export const validateWizardCompleted = inject(
  ({ settingsStore, loggerFactory }: { settingsStore: SettingsStore; loggerFactory: ILoggerFactory }) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const logger = loggerFactory(validateWhitelistedIp.name);
      const serverSettings = settingsStore.getSettings();
      if (!!settingsStore.getWizardSettings()?.wizardCompleted) {
        next();
        return;
      }

      const allowedPaths = [
        "/api/first-time-setup/complete",
        "/api/first-time-setup/validate",
        "/api/test",
        "/api/auth/login-required",
      ];
      if (allowedPaths.includes(req.path) || !req.path.startsWith("/api")) {
        next();
        return;
      } else {
        logger.error("Wizard not completed", req.path);
        throw new ForbiddenError(`First-time-setup not completed, these api paths are enabled: ${allowedPaths.join(", ")}`);
      }
    }
);

export const validateWhitelistedIp = inject(
  ({ settingsStore, loggerFactory }: { settingsStore: SettingsStore; loggerFactory: ILoggerFactory }) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const logger = loggerFactory(validateWhitelistedIp.name);
      const serverSettings = settingsStore.getSettings();
      if ((!serverSettings && !settingsStore.getServerSettings()) || !settingsStore.getServerSettings()?.whitelistEnabled) {
        next();
        return;
      }

      const whitelist = serverSettings[serverSettingsKey].whitelistedIpAddresses;
      const ipAddress = req.socket.remoteAddress;
      // Empty whitelist is treated as disabled as well
      // Both ::ffff:127.0.0.1 and 127.0.0.1 will be accepted
      if (whitelist?.length && !whitelist.includes(ipAddress) && ipAddress !== "::ffff:127.0.0.1") {
        // Direct comparison did not pass - now parse wildcard subnets
        const subnextMatched = whitelist.find((w) => {
          return ipAddress.startsWith(w);
        });

        if (!subnextMatched) {
          logger.error("IP did not match whitelist filters", req.socket.remoteAddress);
          throw new ForbiddenError("Bad IP: " + req.socket.remoteAddress);
        }
      }

      next();
    }
);

export const interceptRoles = inject(
  ({ settingsStore, roleService }) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const serverSettings = await settingsStore.getSettings();

      req.roles = req.user?.roles;

      // If server settings are not set, we can't determine the default role
      if (serverSettings && !req.user) {
        const roleName = await roleService.getAppDefaultRole();
        req.roles = [roleName];
      }

      next();
    }
);
