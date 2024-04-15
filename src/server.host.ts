import express, { Application } from "express";
import mongoose from "mongoose";
import history from "connect-history-api-fallback";
import { LoggerService } from "./handlers/logger";
import { loadControllers } from "awilix-express";
import { join } from "path";
import { exceptionFilter } from "./middleware/exception.filter";
import { fetchServerPort } from "./server.env";
import { NotFoundException } from "./exceptions/runtime.exceptions";
import { AppConstants } from "./server.constants";
import { superRootPath } from "./utils/fs.utils";
import { SocketIoGateway } from "@/state/socket-io.gateway";
import { BootTask } from "./tasks/boot.task";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { isProductionEnvironment } from "@/utils/env.utils";
import { ConfigService } from "@/services/core/config.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { MoonrakerClient } from "@/services/moonraker/moonraker.client";

export class ServerHost {
  bootTask: BootTask;
  taskManagerService: TaskManagerService;
  socketIoGateway: SocketIoGateway;
  appInstance: Application | null = null;
  configService: ConfigService;
  typeormService: TypeormService;
  moonrakerClient: MoonrakerClient;
  private readonly isTypeormMode: boolean;
  private logger: LoggerService;

  constructor({
    loggerFactory,
    bootTask,
    taskManagerService,
    socketIoGateway,
    configService,
    typeormService,
    isTypeormMode,
    moonrakerClient,
  }: {
    loggerFactory: ILoggerFactory;
    bootTask: BootTask;
    taskManagerService: TaskManagerService;
    socketIoGateway: SocketIoGateway;
    configService: ConfigService;
    typeormService: TypeormService;
    moonrakerClient: MoonrakerClient;
    isTypeormMode: boolean;
  }) {
    this.logger = loggerFactory(ServerHost.name);
    this.bootTask = bootTask;
    this.taskManagerService = taskManagerService;
    this.socketIoGateway = socketIoGateway;
    this.configService = configService;
    this.typeormService = typeormService;
    this.moonrakerClient = moonrakerClient;
    this.isTypeormMode = isTypeormMode;
  }

  async boot(app: Application, quick_boot = false, listenRequests = true) {
    if (!this.isTypeormMode) {
      // Enforce models to be strictly applied, any unknown property will not be persisted
      mongoose.set("strictQuery", true);
    }

    this.appInstance = app;
    this.serveControllerRoutes(this.appInstance);

    if (!quick_boot) {
      await this.bootTask.runOnce();
    }

    if (listenRequests) return this.httpListen();
  }

  hasConnected() {
    if (this.isTypeormMode) {
      return this.typeormService.hasConnected();
    } else {
      return mongoose.connections[0].readyState;
    }
  }

  serveControllerRoutes(app: Application) {
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
      .use(loadControllers(`${routePath}/*.controller.*`, { cwd: __dirname, ignore: "**/*.map" }))
      .use(exceptionFilter);

    // Serve the files for our frontend - do this later than the controllers
    const bundleDistPath = join(superRootPath(), AppConstants.defaultClientBundleStorage, "dist");
    app.use(express.static(bundleDistPath));
    // Backup client in node_modules
    const backupClientPath = join(superRootPath(), "node_modules", AppConstants.clientPackageName, "dist");
    app.use(express.static(backupClientPath));

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
      .use(exceptionFilter);
  }

  async httpListen() {
    const port = fetchServerPort();
    if (!isProductionEnvironment() && this.configService.get(AppConstants.debugRoutesKey, "false") === "true") {
      const expressListRoutes = require("express-list-routes");
      expressListRoutes(this.appInstance!, { prefix: "/" });
    }

    if (!port || Number.isNaN(parseInt(port))) {
      throw new Error("The FDM Server requires a numeric port input argument to run");
    }

    const hostOrFqdn = "0.0.0.0";
    const server = this.appInstance!.listen(parseInt(port), hostOrFqdn, () => {
      this.logger.log(`Server started... open it at http://127.0.0.1:${port}`);
    });
    this.socketIoGateway.attachServer(server);
  }
}
