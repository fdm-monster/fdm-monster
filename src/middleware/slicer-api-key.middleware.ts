import { inject } from "awilix-express";
import { NextFunction, Request, Response } from "express";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { AuthenticationError } from "@/exceptions/runtime.exceptions";

/**
 * Middleware to authenticate requests using a slicer API key.
 * This allows slicers like PrusaSlicer to upload files without requiring bearer token authentication.
 *
 * The API key should be passed in the X-Api-Key header.
 * If the header is not present or invalid, the middleware will throw.
 */
export const slicerApiKeyAuth = () =>
  inject(
    (loggerFactory: ILoggerFactory, settingsStore: SettingsStore) =>
      async (req: Request, res: Response, next: NextFunction) => {
        const logger = loggerFactory("Middleware:slicerApiKeyAuth");

        const apiKey = req.headers["x-api-key"] as string | undefined;

        if (!apiKey?.length) {
          throw new AuthenticationError("Header x-api-key is missing");
        }

        const isValid = settingsStore.validateSlicerApiKey(apiKey);
        if (isValid) {
          logger.log(`Slicer API key authentication successful for ${req.originalUrl}`);
          // Mark request as authenticated via API key
          (req as any).slicerApiKeyAuthenticated = true;
          return next();
        }

        logger.warn(`Invalid slicer API key provided for ${req.originalUrl}`);
        throw new AuthenticationError("Header x-api-key is wrong");
      },
  );
