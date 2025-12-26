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
import { Counter } from "prom-client";
import { LoggerService } from "@/handlers/logger";

const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "HTTP requests executed",
});

export async function setupServer() {
  const httpServer = express();

  const dbFolder = process.env[AppConstants.DATABASE_PATH] ?? "./database";
  ensureDirExists(join(superRootPath(), dbFolder));

  const container = configureContainer();
  initializePassportStrategies(passport, container);

  httpServer
    .use((req, res, next) => {
      const route = req.route?.path ?? req.path ?? "unknown";

      if (route.includes("/api")) {
        const start = process.hrtime();

        res.on("finish", () => {
          httpRequestsTotal.inc();

          const delta = process.hrtime(start);
          const duration = delta[0] + delta[1] / 1e9;
          const logger = new LoggerService("HttpRequest");
          logger.newDebug({
            message: `HTTP request ${req.method} ${req.originalUrl} ${res.statusCode}`,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            responseTimeMs: duration.toFixed(2),
            clientIp: req.ip,
            userAgent: req.get("User-Agent"),
          });
        });
      }

      next();
    })
    .use(
      cors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      }),
    )
    .use(
      helmet({
        contentSecurityPolicy: false,
      }),
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
