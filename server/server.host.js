const express = require("express");
const mongoose = require("mongoose");
const history = require("connect-history-api-fallback");
const { loadControllers } = require("awilix-express");
const exceptionHandler = require("./middleware/exception.handler");
const { getAppDistPath, fetchServerPort } = require("./server.env");
const { NotFoundException } = require("./exceptions/runtime.exceptions");
const { interceptDatabaseError } = require("./middleware/database");

class ServerHost {
  #logger;
  #bootTask;
  #taskManagerService;
  #httpServerInstance = null;

  constructor({ loggerFactory, bootTask, taskManagerService }) {
    this.#logger = loggerFactory("Server");
    this.#bootTask = bootTask;
    this.#taskManagerService = taskManagerService;
  }

  async boot(httpServer, quick_boot = false, listenRequests = true) {
    this.#httpServerInstance = httpServer;
    this.serveControllerRoutes(this.#httpServerInstance);

    if (!quick_boot) {
      await this.#bootTask.runOnce();
    }

    if (listenRequests) return this.httpListen();
  }

  hasConnected() {
    return mongoose.connections[0].readyState;
  }

  serveControllerRoutes(app) {
    const routePath = "./controllers";

    // Catches any HTML request to paths like / or file/ as long as its text/html
    app
      .use((req, res, next) => {
        if (!req.originalUrl.startsWith("/api")) {
          history()(req, res, next);
        } else {
          next();
        }
      })
      .use(loadControllers(`${routePath}/settings/*.controller.js`, { cwd: __dirname }))
      .use(loadControllers(`${routePath}/*.controller.js`, { cwd: __dirname }))
      .use(interceptDatabaseError)
      .use(exceptionHandler);

    // Serve the files for our frontend - do this later than the controllers
    const appDistPath = getAppDistPath();
    if (appDistPath) {
      app.use(express.static(appDistPath)).get("/", function (req, res) {
        res.sendFile("index.html", { root: appDistPath });
      });
    } else {
      this.#logger.warning("~ Skipped loading Vue frontend as no path was returned");
    }

    app
      .get("*", (req, res) => {
        const path = req.originalUrl;

        let resource = "MVC";
        if (path.startsWith("/api") || path.startsWith("/plugins")) {
          resource = "API";
        } else if (path.endsWith(".min.js")) {
          resource = "client-bundle";
        }

        this.#logger.error(`${resource} resource at '${path}' was not found`);

        throw new NotFoundException(`${resource} resource was not found`, path);
      })
      .use(exceptionHandler);
  }

  async httpListen() {
    const port = fetchServerPort();

    if (!port || Number.isNaN(parseInt(port))) {
      throw new Error("The 3DPF Server requires a numeric port input argument to run");
    }

    this.#httpServerInstance.listen(port, "0.0.0.0", () => {
      this.#logger.info(`Server started... open it at http://127.0.0.1:${port}`);
    });
  }
}

module.exports = ServerHost;
