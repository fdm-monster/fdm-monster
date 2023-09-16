import LoggerService from "./handlers/logger";

import express from "express";
import mongoose from "mongoose";
import history from "connect-history-api-fallback";
import { loadControllers } from "awilix-express";
import { join } from "path";

const exceptionHandler = require("./middleware/exception.handler");
const { fetchServerPort } = require("./server.env");
const { NotFoundException } = require("./exceptions/runtime.exceptions");
const { AppConstants } = require("./server.constants");
const { superRootPath, rootPath } = require("./utils/fs.utils");

export class ServerHost {
  /**
   * @type {LoggerService}
   */
  private logger: LoggerService;
  /**
   * @type {BootTask}
   */
  bootTask;
  /**
   * @type {TaskManagerService}
   */
  taskManagerService;
  /**
   * @type {SocketIoGateway}
   */
  socketIoGateway;
  appInstance = null;

  constructor({ loggerFactory, bootTask, taskManagerService, socketIoGateway }) {
    this.logger = loggerFactory(ServerHost.name);
    this.bootTask = bootTask;
    this.taskManagerService = taskManagerService;
    this.socketIoGateway = socketIoGateway;
  }

  async boot(app, quick_boot = false, listenRequests = true) {
    // Enforce models to be strictly applied, any unknown property will not be persisted
    mongoose.set("strictQuery", true);

    this.appInstance = app;
    this.serveControllerRoutes(this.appInstance);

    if (!quick_boot) {
      await this.bootTask.runOnce();
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
        if (!req.originalUrl.startsWith("/api") && !req.originalUrl.startsWith("/socket.io")) {
          history()(req, res, next);
        } else {
          next();
        }
      })
      .use(loadControllers(`${routePath}/*.controller.js`, { cwd: __dirname }))
      .use(exceptionHandler);

    // Serve the files for our frontend - do this later than the controllers
    const bundleDistPath = join(superRootPath(), AppConstants.defaultClientBundleStorage, "dist");
    app.use(express.static(bundleDistPath));
    // Backup client in node_modules
    app.use(express.static(join(rootPath(), "node_modules", AppConstants.clientPackageName, "dist")));

    app
      .get("*", (req, res) => {
        const path = req.originalUrl;

        let resource = "MVC";
        if (path.startsWith("/socket.io") || path.startsWith("/api") || path.startsWith("/plugins")) {
          resource = "API";
        } else if (path.endsWith(".min.js")) {
          resource = "client-bundle";
        }

        this.logger.error(`${resource} resource at '${path}' was not found`);

        if (!path.startsWith("/socket.io")) {
          throw new NotFoundException(`${resource} resource was not found`, path);
        }
      })
      .use(exceptionHandler);
  }

  async httpListen() {
    const port = fetchServerPort();

    if (!port || Number.isNaN(parseInt(port))) {
      throw new Error("The FDM Server requires a numeric port input argument to run");
    }

    const hostOrFqdn = "0.0.0.0";
    const server = this.appInstance.listen(port, hostOrFqdn, () => {
      this.logger.log(`Server started... open it at http://127.0.0.1:${port}`);
    });
    this.socketIoGateway.attachServer(server);
  }
}
