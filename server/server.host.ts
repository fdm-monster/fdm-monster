import path from "path";
import express from "express";
import mongoose from "mongoose";
import history from "connect-history-api-fallback";
import exceptionHandler from "./middleware/exception.handler.js";
import {fetchServerPort, getAppDistPath} from "./server.env.js";
import {NotFoundException} from "./exceptions/runtime.exceptions.js";
import {interceptDatabaseError} from "./middleware/database.js";
import awilixExpress from "awilix-express";

const {loadControllers} = awilixExpress;

class ServerHost {
    #logger;
    #bootTask;
    #taskManagerService;
    #httpServerInstance = null;

    constructor({loggerFactory, bootTask, taskManagerService}) {
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
        if (listenRequests)
            return this.httpListen();
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
            .use(loadControllers(`${routePath}/server/*.controller.js`, {cwd: path.resolve()}))
            .use(loadControllers(`${routePath}/*.controller.js`, {cwd: path.resolve()}))
            .use(interceptDatabaseError)
            .use(exceptionHandler);
        // Serve the files for our frontend - do this later than the controllers
        const appDistPath = getAppDistPath();
        if (appDistPath) {
            app.use(express.static(appDistPath)).get("/", function (req, res) {
                res.sendFile("index.html", {root: appDistPath});
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
            throw new Error("The 3DH Server requires a numeric port input argument to run");
        }
        this.#httpServerInstance.listen(port, "0.0.0.0", () => {
            this.#logger.info(`Server started... open it at http://127.0.0.1:${port}`);
        });
    }
}

export default ServerHost;
