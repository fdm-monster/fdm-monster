const mongoose = require("mongoose");
const { fetchMongoDBConnectionString } = require("./app-env");
const { runMigrations, fetchServerPort } = require("./app-env");
const { ServerTasks } = require("./tasks");
const history = require("connect-history-api-fallback");
const { loadControllers } = require("awilix-express");
const exceptionHandler = require("./exceptions/exception.handler");
const { getAppDistPath } = require("./app-env");
const express = require("express");
const { NotFoundException } = require("./exceptions/runtime.exceptions");

class ServerHost {
  #serverSettingsService;
  #settingsStore;

  #logger;
  #httpServerInstance = null;
  #connection = null;
  #isInitiated = false;

  // Startup dependencies
  multerService;
  printersStore;
  filesStore;
  printerGroupsCache;
  currOpsCache;
  historyCache;
  filamentCache;
  taskManagerService;
  influxDbSetupService;

  constructor({
    loggerFactory,
    serverSettingsService,
    settingsStore,
    multerService,
    printersStore,
    filesStore,
    printerGroupsCache,
    currentOperationsCache,
    historyCache,
    filamentCache,
    taskManagerService,
    influxDbSetupService
  }) {
    this.#logger = loggerFactory("Server");

    this.#serverSettingsService = serverSettingsService;
    this.#settingsStore = settingsStore;
    this.multerService = multerService;
    this.printersStore = printersStore;
    this.filesStore = filesStore;
    this.printerGroupsCache = printerGroupsCache;
    this.currOpsCache = currentOperationsCache;
    this.historyCache = historyCache;
    this.filamentCache = filamentCache;
    this.taskManagerService = taskManagerService;
    this.influxDbSetupService = influxDbSetupService;
  }

  async boot(httpServer, quick_boot) {
    this.#httpServerInstance = httpServer;
    this.serveControllerRoutes(this.#httpServerInstance);

    try {
      await this.createConnection();
      await this.migrateDatabase();

      if (!quick_boot) {
        this.#logger.info("Loading Server Settings.");
        await this.#settingsStore.loadSettings();

        await this.multerService.clearUploadsFolder();
        await this.printersStore.loadPrintersStore();
        await this.filesStore.loadFilesStore();
        await this.printerGroupsCache.loadCache();
        this.currOpsCache.generateCurrentOperations();
        await this.historyCache.initCache();
        await this.filamentCache.initCache();

        if (process.env.SAFEMODE_ENABLED !== "true") {
          ServerTasks.BOOT_TASKS.forEach((task) => this.taskManagerService.registerJobOrTask(task));
        } else {
          this.#logger.warning("Starting in safe mode due to SAFEMODE_ENABLED");
        }

        await this.influxDbSetupService.optionalInfluxDatabaseSetup();
      }
    } catch (e) {
      console.error(e);
    }

    return this.httpListen();
  }

  async createConnection() {
    this.#connection = await mongoose.connect(fetchMongoDBConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      serverSelectionTimeoutMS: 1500
    });
  }

  async migrateDatabase() {
    const mg = this.#connection;
    await runMigrations(mg.connection.db, mg.connection.getClient());
  }

  serveControllerRoutes(app) {
    const routePath = "./controllers";

    // Catches any HTML request to paths like / or file/ as long as its text/html
    app.use(history());
    // Serve the API
    app.use(loadControllers(`${routePath}/settings/*.controller.js`, { cwd: __dirname }));
    app.use(loadControllers(`${routePath}/*.controller.js`, { cwd: __dirname }));
    app.use(exceptionHandler);

    // Serve the files for our frontend - do this later than the controllers
    const appDistPath = getAppDistPath();
    if (appDistPath) {
      app.use(express.static(appDistPath));
      app.get("/", function (req, res) {
        res.sendFile("index.html", { root: appDistPath });
      });
    } else {
      this.#logger.warning("~ Skipped loading Vue frontend as no path was returned");
    }

    app.get("*", (req, res) => {
      const path = req.originalUrl;

      let resource = "MVC";
      if (path.startsWith("/api") || path.startsWith("/plugins")) {
        resource = "API";
      } else if (path.endsWith(".min.js")) {
        resource = "client-bundle";
      }

      this.#logger.error(`${resource} resource at '${path}' was not found`);

      throw new NotFoundException(`${resource} resource was not found`, path);
    });
    app.use(exceptionHandler);
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
