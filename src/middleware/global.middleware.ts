import { inject } from "awilix-express";
import { ForbiddenError } from "@/exceptions/runtime.exceptions";
import { NextFunction, Request, Response } from "express";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IConfigService } from "@/services/core/config.service";
import { IRoleService } from "@/services/interfaces/role-service.interface";

export const validateWizardCompleted = inject(
  (configService: IConfigService, settingsStore: SettingsStore, loggerFactory: ILoggerFactory) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      const logger = loggerFactory(validateWizardCompleted.name);
      const isDemoMode = configService.isDemoMode();
      if (isDemoMode || !!settingsStore.getWizardSettings()?.wizardCompleted) {
        next();
        return;
      }

      const allowedPaths = [
        "/api/first-time-setup/complete",
        "/api/first-time-setup/validate",
        "/api/first-time-setup/yaml-import",
        "/api/test",
        "/api/auth/login-required",
      ];
      if (allowedPaths.includes(req.path) || !req.path.startsWith("/api") || req.path.startsWith("/api-docs")) {
        next();
      } else {
        logger.error("Wizard not completed", req.path);
        throw new ForbiddenError(
          `First-time-setup not completed, these api paths are enabled: ${allowedPaths.join(", ")}`,
        );
      }
    },
);

export const interceptRoles = inject(
  (settingsStore: SettingsStore, roleService: IRoleService) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      const serverSettings = settingsStore.getSettings();

      req.roles = req.user?.roles ?? [];

      // If server settings are not set, we can't determine the default role
      if (serverSettings && !req.user) {
        req.roles = await roleService.getAppDefaultRoleNames();
      }

      next();
    },
);
