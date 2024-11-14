import express, { json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";
import helmet from "helmet";
import { scopePerRequest } from "awilix-express";
import { configureContainer } from "./container";
import { interceptDatabaseError } from "./middleware/database";
import { interceptRoles, validateWizardCompleted } from "./middleware/global.middleware";
import { initializePassportStrategies } from "./middleware/passport";
import { AppConstants } from "@/server.constants";
import { join } from "path";
import { ensureDirExists, superRootPath } from "@/utils/fs.utils";
import { getEnvOrDefault } from "@/utils/env.utils";

export async function setupServer() {
  const httpServer = express();
  const experimentalTypeormEnabled =
    getEnvOrDefault(AppConstants.ENABLE_EXPERIMENTAL_TYPEORM, AppConstants.enableExperimentalTypeormDefault) === "true";
  if (experimentalTypeormEnabled) {
    const dbFolder = process.env[AppConstants.DATABASE_PATH] || "./database";
    ensureDirExists(join(superRootPath(), dbFolder));
  }

  const container = configureContainer(experimentalTypeormEnabled);
  initializePassportStrategies(passport, container);

  httpServer
    .use(
      cors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      })
    )
    .use(
      helmet({
        contentSecurityPolicy: false,
      })
    )
    .use(json({ limit: "10mb" }))
    .use(cookieParser())
    .use(urlencoded({ extended: false }))
    .use(passport.initialize())
    .use(passport.authenticate(["jwt", "anonymous"], { session: false }))
    .use(scopePerRequest(container))
    .use(interceptDatabaseError)
    // Global guards
    .use(validateWizardCompleted)
    .use(interceptRoles);

  return {
    httpServer,
    container,
  };
}
