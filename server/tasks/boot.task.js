const mongoose = require("mongoose");
const { ServerTasks } = require("../tasks");
const { fetchMongoDBConnectionString, runMigrations } = require("../server.env");
const DITokens = require("../container.tokens");
const MongooseError = require("mongoose/lib/error/mongooseError");

module.exports = class BootTask {
  #logger;
  #taskManagerService;

  settingsStore;
  serverSettingsService;
  multerService;
  printersStore;
  filesStore;
  printerGroupsCache;
  currOpsCache;
  historyCache;
  filamentCache;
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
    this.serverSettingsService = serverSettingsService;
    this.settingsStore = settingsStore;
    this.multerService = multerService;
    this.printersStore = printersStore;
    this.filesStore = filesStore;
    this.printerGroupsCache = printerGroupsCache;
    this.currOpsCache = currentOperationsCache;
    this.historyCache = historyCache;
    this.filamentCache = filamentCache;
    this.#taskManagerService = taskManagerService;
    this.influxDbSetupService = influxDbSetupService;
    this.#logger = loggerFactory("Server");
  }

  async runOnce() {
    // To cope with retries after failures we register this task - disabled
    this.#taskManagerService.registerJobOrTask(ServerTasks.SERVER_BOOT_TASK);

    await this.run(true);
  }

  async run(bootTaskScheduler = false) {
    try {
      await this.createConnection();
      await this.migrateDatabase();
    } catch (e) {
      if (e instanceof MongooseError) {
        if (e.message.includes("ECONNREFUSED")) {
          this.#logger.error("Database connection timed-out. Retrying in 5000.");
        }

        this.#taskManagerService.scheduleDisabledJob(DITokens.bootTask, false);
        return;
      }
    }

    this.#logger.info("Loading Server settings.");
    await this.settingsStore.loadSettings();

    this.#logger.info("Loading caches.");
    await this.multerService.clearUploadsFolder();
    await this.printersStore.loadPrintersStore();
    await this.filesStore.loadFilesStore();
    await this.printerGroupsCache.loadCache();
    this.currOpsCache.generateCurrentOperations();
    await this.historyCache.initCache();
    await this.filamentCache.initCache();
    await this.influxDbSetupService.optionalInfluxDatabaseSetup();

    if (bootTaskScheduler && process.env.SAFEMODE_ENABLED !== "true") {
      ServerTasks.BOOT_TASKS.forEach((task) => {
        this.#taskManagerService.registerJobOrTask(task);
      });
    } else {
      this.#logger.warning("Starting in safe mode due to SAFEMODE_ENABLED");
    }

    // Success so we disable this task
    this.#taskManagerService.disableJob(DITokens.bootTask, false);
  }

  async createConnection() {
    await mongoose.connect(fetchMongoDBConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      serverSelectionTimeoutMS: 1500
    });
  }

  async migrateDatabase() {
    await runMigrations(mongoose.connection.db, mongoose.connection.getClient());
  }
};
