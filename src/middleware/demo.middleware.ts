import { ForbiddenError } from "@/exceptions/runtime.exceptions";
import { NextFunction, Request, Response } from "express";
import { inject } from "awilix-express";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IConfigService } from "@/services/core/config.service";
import { IUserService } from "@/services/interfaces/user-service.interface";

export const demoUserNotAllowed = inject(
  ({
    userService,
    configService,
    loggerFactory,
  }: {
    userService: IUserService;
    configService: IConfigService;
    loggerFactory: ILoggerFactory;
  }) => {
    const logger = loggerFactory(demoUserNotAllowed.name);
    return async (req: Request, res: Response, next: NextFunction) => {
      const isDemoMode = configService.isDemoMode();
      if (!isDemoMode) {
        next();
        return;
      }
      const demoUserId = await userService.getDemoUserId();
      if (req.user?.id === demoUserId) {
        logger.warn("Demo user attempted to access restricted resource", req.path);
        throw new ForbiddenError("Demo user attempted to access restricted resource");
      }
      next();
    };
  }
);
