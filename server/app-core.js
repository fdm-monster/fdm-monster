const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const DITokens = require("./container.tokens");
const { configureContainer } = require("./container");
const { scopePerRequest } = require("awilix-express");
const cors = require("cors");

function setupNormalServer() {
  let httpServer = express();
  let container = configureContainer();

  const userTokenService = container.resolve(DITokens.userTokenService);
  require("./middleware/passport.js")(passport, userTokenService);

  httpServer.use(
    cors({
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
    })
  );
  httpServer.use(express.json({ limit: "10mb" }));

  httpServer.use("/images", express.static("./images"));
  httpServer.use(cookieParser());
  httpServer.use(express.urlencoded({ extended: false }));
  httpServer.use(
    session({
      secret: "supersecret",
      resave: true,
      saveUninitialized: true
    })
  );
  httpServer.use(passport.initialize());
  httpServer.use(passport.session());
  httpServer.use(passport.authenticate("remember-me")); // Remember Me!

  httpServer.use(scopePerRequest(container));

  return {
    httpServer,
    container
  };
}

module.exports = {
  setupNormalServer
};
