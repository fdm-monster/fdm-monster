import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import { scopePerRequest } from "awilix-express";
import cors from "cors";
import helmet from "helmet";
import { configureContainer } from "./container";
import { interceptDatabaseError } from "./middleware/database";
import { validateWhitelistedIp, interceptRoles } from "./middleware/global.middleware";
import { initializePassportStrategies } from "./middleware/passport";

export async function setupServer() {
  const httpServer = express();
  const container = configureContainer();
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
    .use(express.json({ limit: "10mb" }))
    .use(cookieParser())
    .use(express.urlencoded({ extended: false }))
    .use(
      session({
        secret: "supersecret",
        resave: true,
        saveUninitialized: true,
      })
    )
    .use(passport.initialize())
    .use(passport.authenticate(["jwt", "anonymous"], { session: false }))
    .use(scopePerRequest(container))
    .use(interceptDatabaseError)
    // Global guards
    .use(validateWhitelistedIp)
    .use(interceptRoles);

  return {
    httpServer,
    container,
  };
}
