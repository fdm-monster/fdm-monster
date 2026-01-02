import express, { Application } from "express";
import history from "connect-history-api-fallback";
import { LoggerService } from "./handlers/logger";
import { join } from "node:path";
import { ExceptionFilter } from "./middleware/exception.filter";
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
import { loadControllersFunc } from "@/shared/load-controllers";
import { setupSwagger } from "@/utils/swagger/swagger";

export class ServerHost {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly configService: IConfigService,
    private readonly bootTask: BootTask,
    private readonly socketIoGateway: SocketIoGateway,
    private readonly typeormService: TypeormService,
    private readonly exceptionFilter: ExceptionFilter,
  ) {
    this.logger = loggerFactory(ServerHost.name);
  }

  async boot(app: Application, quick_boot = false, listenRequests = true) {
    await this.serveControllerRoutes(app);

    if (!quick_boot) {
      await this.bootTask.runOnce();
    }

    if (listenRequests) return this.httpListen(app);
  }

  hasConnected() {
    return this.typeormService.hasConnected();
  }

  async serveControllerRoutes(app: Application) {
    const swaggerDisabled = process.env[AppConstants.DISABLE_SWAGGER_OPENAPI] === "true";

    // Redirect /api to swagger documentation (must be before controller loading)
    if (!swaggerDisabled) {
      app.get("/api", (_req, res) => {
        res.redirect("/api-docs/swagger.json");
      });
    }

    // Catches any HTML request to paths like / or file/ as long as its text/html
    app
      .use((req, res, next) => {
        if (
          !req.originalUrl.startsWith("/metrics") &&
          !req.originalUrl.startsWith("/api") &&
          !req.originalUrl.startsWith("/api-docs") &&
          !req.originalUrl.startsWith("/socket.io")
        ) {
          history()(req, res, next);
        } else {
          next();
        }
      })
      .use(loadControllersFunc());

    // Setup Swagger documentation (if enabled)
    if (swaggerDisabled) {
      this.logger.log("Swagger/OpenAPI documentation disabled");
    } else {
      await setupSwagger(app, this.logger);
      this.logger.log("Swagger/OpenAPI documentation enabled");
    }

    const bundleDistPath = join(superRootPath(), AppConstants.defaultClientBundleStorage, "dist");
    const backupClientPath = join(superRootPath(), "node_modules", AppConstants.clientPackageName, "dist");

    // Serve the main bundle
    app.use(express.static(bundleDistPath));

    // Serve the backup client
    app.use(express.static(backupClientPath));

    app.get("*", (req, _) => {
      const path = req.originalUrl;

      let resource = "MVC";
      if (path.startsWith("/socket.io") || path.startsWith("/api") || path.startsWith("/metrics") || path.startsWith("/api-docs")) {
        resource = "API";
      } else if (path.endsWith(".min.js")) {
        resource = "client-bundle";
      }

      this.logger.error(`${resource} resource at '${path}' was not found`);

      if (!path.startsWith("/socket.io")) {
        throw new NotFoundException(`${resource} resource was not found`, path);
      }
    });

    app.use(this.exceptionFilter.handle.bind(this.exceptionFilter));
  }

  async httpListen(app: Application) {
    const port = fetchServerPort();
    if (!isProductionEnvironment() && this.configService.get<string>(AppConstants.debugRoutesKey, "false") === "true") {
      const expressListRoutes = require("express-list-routes");
      expressListRoutes(app, { prefix: "/" });
    }

    if (!port || Number.isNaN(Number.parseInt(port))) {
      throw new Error("The FDM Server requires a numeric port input argument to run");
    }

    const swaggerDisabled = process.env[AppConstants.DISABLE_SWAGGER_OPENAPI] === "true";
    const hostOrFqdn = "0.0.0.0";
    const server = app.listen(Number.parseInt(port), hostOrFqdn, () => {
      this.logger.log(`Server started... open it at http://127.0.0.1:${port}`);
      if (!swaggerDisabled) {
        this.logger.log(`API Documentation available at http://127.0.0.1:${port}/api-docs`);
      }
    });
    this.socketIoGateway.attachServer(server);
  }
}
