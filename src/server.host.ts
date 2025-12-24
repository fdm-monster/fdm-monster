import express, { Application } from "express";
import history from "connect-history-api-fallback";
import { LoggerService } from "./handlers/logger";
import { join } from "path";
import { exceptionFilter } from "./middleware/exception.filter";
import { fetchServerPort } from "./server.env";
import { NotFoundException } from "./exceptions/runtime.exceptions";
import { AppConstants } from "./server.constants";
import { superRootPath } from "./utils/fs.utils";
import { SocketIoGateway } from "@/state/socket-io.gateway";
import { BootTask } from "./tasks/boot.task";
import { isProductionEnvironment } from "@/utils/env.utils";
import { IConfigService } from "@/services/core/config.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { SettingsStore } from "@/state/settings.store";
import { loadControllersFunc } from "@/shared/load-controllers";

export class ServerHost {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly configService: IConfigService,
    private readonly settingsStore: SettingsStore,
    private readonly bootTask: BootTask,
    private readonly socketIoGateway: SocketIoGateway,
    private readonly typeormService: TypeormService,
  ) {
    this.logger = loggerFactory(ServerHost.name);
  }

  async boot(app: Application, quick_boot = false, listenRequests = true) {
    this.serveControllerRoutes(app);

    if (!quick_boot) {
      await this.bootTask.runOnce();
    }

    if (listenRequests) return this.httpListen(app);
  }

  hasConnected() {
    return this.typeormService.hasConnected();
  }

  serveControllerRoutes(app: Application) {
    // Catches any HTML request to paths like / or file/ as long as its text/html
    app
      .use((req, res, next) => {
        if (!req.originalUrl.startsWith("/metrics")
          && !req.originalUrl.startsWith("/api")
          && !req.originalUrl.startsWith("/socket.io")) {
          history()(req, res, next);
        } else {
          next();
        }
      })
      .use(loadControllersFunc());

    const nextClientPath = join(superRootPath(), "node_modules", AppConstants.clientNextPackageName, "dist");
    const bundleDistPath = join(superRootPath(), AppConstants.defaultClientBundleStorage, "dist");
    const backupClientPath = join(superRootPath(), "node_modules", AppConstants.clientPackageName, "dist");

    // Middleware to serve nextClientPath if isClientNextEnabled() is true
    app.use((req, res, next) => {
      if (this.isClientNextEnabled()) {
        express.static(nextClientPath)(req, res, next);
      } else {
        next();
      }
    });

    // Serve the main bundle
    app.use(express.static(bundleDistPath));

    // Serve the backup client
    app.use(express.static(backupClientPath));

    app.get("*", (req, _) => {
      const path = req.originalUrl;

      let resource = "MVC";
      if (path.startsWith("/socket.io")
        || path.startsWith("/api")
        || path.startsWith("/metrics")) {
        resource = "API";
      } else if (path.endsWith(".min.js")) {
        resource = "client-bundle";
      }

      this.logger.error(`${ resource } resource at '${ path }' was not found`);

      if (!path.startsWith("/socket.io")) {
        throw new NotFoundException(`${ resource } resource was not found`, path);
      }
    });

    app.use(exceptionFilter);
  }

  async httpListen(app: Application) {
    const port = fetchServerPort();
    if (!isProductionEnvironment() && this.configService.get<string>(AppConstants.debugRoutesKey, "false") === "true") {
      const expressListRoutes = require("express-list-routes");
      expressListRoutes(app, {prefix: "/"});
    }

    if (!port || Number.isNaN(Number.parseInt(port))) {
      throw new Error("The FDM Server requires a numeric port input argument to run");
    }

    const hostOrFqdn = "0.0.0.0";
    const server = app.listen(parseInt(port), hostOrFqdn, () => {
      this.logger.log(`Server started... open it at http://127.0.0.1:${ port }`);
    });
    this.socketIoGateway.attachServer(server);
  }

  private isClientNextEnabled() {
    const settings = this.settingsStore.getServerSettings();
    return settings.experimentalClientSupport;
  }
}
