import { inject } from "awilix-express";
import { ForbiddenError } from "@/exceptions/runtime.exceptions";
import type { NextFunction, Request, Response } from "express";
import { SettingsStore } from "@/state/settings.store";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import type { IConfigService } from "@/services/core/config.service";
import type { IRoleService } from "@/services/interfaces/role-service.interface";

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
        "/api/v2/first-time-setup/complete",
        "/api/v2/first-time-setup/validate",
        "/api/v2/first-time-setup/yaml-import",
        "/api/v2/test",
        "/api/v2/auth/login-required",
      ];
      if (allowedPaths.includes(req.path) || !req.path.startsWith("/api/v2") || req.path.startsWith("/api-docs")) {
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
