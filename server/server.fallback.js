const express = require("express");
const { AppConstants } = require("./app.constants");
const dotenv = require("dotenv");
const path = require("path");

const Logger = require("./handlers/logger.js");
const exceptionHandler = require("./middleware/exception.handler");
const { loadControllers } = require("awilix-express");
const logger = new Logger("Fallback-Server");
const routePath = "./routes";
const fallbacksRoutePath = `${routePath}/fallbacks`;
const opts = { cwd: __dirname };

function setupFallbackServer() {
  let app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    res.send({
      error:
        "You're running this server under Node 12 or older which is not supported. Please upgrade. Now."
    });
  });

  return app;
}

function fetchServerPort() {
  dotenv.config({ path: path.join(__dirname, ".env") });

  let port = process.env[AppConstants.SERVER_PORT_KEY];
  if (Number.isNaN(parseInt(port))) {
    logger.warning(
      `~ The ${AppConstants.SERVER_PORT_KEY} setting was not a correct port number: >= 0 and < 65536. Actual value: ${port}.`
    );

    // Update config immediately
    process.env[AppConstants.SERVER_PORT_KEY] = AppConstants.defaultServerPort.toString();
    port = process.env[AppConstants.SERVER_PORT_KEY];
  }
  return port;
}

function serveNode12Fallback(app) {
  const port = fetchServerPort();
  let listenerHttpServer = app.listen(port, "0.0.0.0", () => {
    const msg = `You have an old Node version: ${process.version}. This needs to be version 14.x or higher... open our webpage at http://127.0.0.1:${port} for tips`;
    logger.info(msg);
  });

  // This controller has its own /amialive so dont load that
  app.use(loadControllers(`${fallbacksRoutePath}/fallback-node-version-issue.controller.js`, opts));
  app.get("*", function (req, res) {
    res.redirect("/");
  });
  app.use(exceptionHandler);

  return listenerHttpServer;
}

module.exports = {
  serveNode12Fallback,
  setupFallbackServer
};
