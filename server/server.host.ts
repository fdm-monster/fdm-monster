import express, { Application } from "express";
import mongoose from "mongoose";
import history from "connect-history-api-fallback";
import { LoggerService } from "./handlers/logger";
import { loadControllers } from "awilix-express";
import { join } from "path";
import { exceptionHandler } from "./middleware/exception.handler";
import { fetchServerPort } from "./server.env";
import { NotFoundException } from "./exceptions/runtime.exceptions";
import { AppConstants } from "./server.constants";
import { rootPath, superRootPath } from "./utils/fs.utils";
import expressListRoutes from "express-list-routes";
import { SocketIoGateway } from "@/state/socket-io.gateway";
import { BootTask } from "./tasks/boot.task";
import { TaskManagerService } from "@/services/task-manager.service";

export class ServerHost {
  bootTask: BootTask;
  taskManagerService: TaskManagerService;
  socketIoGateway: SocketIoGateway;
  appInstance: Application | null = null;
  /**
   * @type {LoggerService}
   */
  private logger: LoggerService;

  constructor({ loggerFactory, bootTask, taskManagerService, socketIoGateway }) {
    this.logger = loggerFactory(ServerHost.name);
    this.bootTask = bootTask;
    this.taskManagerService = taskManagerService;
    this.socketIoGateway = socketIoGateway;
  }

  async boot(app: Application, quick_boot = false, listenRequests = true) {
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
      .use(loadControllers(`${routePath}/*.controller.*`, { cwd: __dirname }))
      .use(exceptionHandler);

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
      .use(exceptionHandler);
  }

  async httpListen() {
    const port = fetchServerPort();
    expressListRoutes(this.appInstance!, { prefix: "/" });
    if (!port || Number.isNaN(parseInt(port))) {
      throw new Error("The FDM Server requires a numeric port input argument to run");
    }

    const hostOrFqdn = "0.0.0.0";
    const server = this.appInstance!.listen(port, hostOrFqdn, () => {
      this.logger.log(`Server started... open it at http://127.0.0.1:${port}`);
    });
    this.socketIoGateway.attachServer(server);
  }
}
