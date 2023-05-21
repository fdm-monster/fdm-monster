const express = require("express");
const { AppConstants } = require("./server.constants");
const dotenv = require("dotenv");
const path = require("path");

const Logger = require("./handlers/logger.js");
const exceptionHandler = require("./middleware/exception.handler");
const logger = new Logger("Fallback-Server");

function setupFallbackServer() {
  return express()
    .use(express.json())
    .use(express.urlencoded({ extended: false }));
}

function fetchServerPort() {
  dotenv.config({ path: path.join(__dirname, ".env") });

  let port = process.env[AppConstants.SERVER_PORT_KEY];
  if (Number.isNaN(parseInt(port))) {
    logger.warn(
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
    logger.log(msg);
  });

  app
    .get("*", function (req, res) {
      res.send({
        error:
          "You're running this server under Node 12 or older which is not supported. Please upgrade. Now."
      });
    })
    .use(exceptionHandler);

  return listenerHttpServer;
}

module.exports = {
  serveNode12Fallback,
  setupFallbackServer
};
