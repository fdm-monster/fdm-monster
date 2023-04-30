const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { configureContainer } = require("./container");
const { scopePerRequest } = require("awilix-express");
const cors = require("cors");
const helmet = require("helmet");
const { interceptDatabaseError } = require("./middleware/database");
const { validateWhitelistedIp, interceptRoles } = require("./middleware/global.middleware");
const passportMiddleware = require("./middleware/passport");
const Logger = require("./handlers/logger.js");
const Sentry = require("@sentry/node");
const { errorSummary } = require("./utils/error.utils");
const { AppConstants } = require("./server.constants");
const { getEnvOrDefault } = require("./utils/env.utils");

const logger = new Logger("Server-Core", true);

function setupServer() {
  const httpServer = express();
  const container = configureContainer();

  passportMiddleware(passport);

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
    .use("/images", express.static("./images"))
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
    .use(passport.session())
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

module.exports = {
  setupServer,
};
