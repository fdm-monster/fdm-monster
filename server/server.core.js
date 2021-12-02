const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const DITokens = require("./container.tokens");
const { configureContainer } = require("./container");
const { scopePerRequest } = require("awilix-express");
const cors = require("cors");
const { interceptRoles } = require("./middleware/authorization");
const helmet = require("helmet");
const { AppConstants } = require("./server.constants");

function setupNormalServer() {
  const httpServer = express();
  const container = configureContainer();

  const userTokenService = container.resolve(DITokens.userTokenService);
  require("./middleware/passport.js")(passport, userTokenService);

  httpServer
    .use(
      cors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
      })
    )
    .use(
      helmet({
        contentSecurityPolicy: process.env[AppConstants.CONTENT_SECURITY_POLICY_ENABLED] || false
        // hsts: true
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
        saveUninitialized: true
      })
    )
    .use(passport.initialize())
    .use(passport.session())
    .use(passport.authenticate("remember-me"))
    .use(scopePerRequest(container))
    .use(interceptRoles);

  return {
    httpServer,
    container
  };
}

module.exports = {
  setupNormalServer
};
