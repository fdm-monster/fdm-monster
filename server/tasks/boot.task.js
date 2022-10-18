const mongoose = require("mongoose");

const { fetchMongoDBConnectionString, runMigrations } = require("../server.env");
const DITokens = require("../container.tokens");
const MongooseError = require("mongoose/lib/error/mongooseError");
const { ROLES } = require("../constants/authorization.constants");

class BootTask {
  #logger;
  #taskManagerService;
  #serverTasks;
  settingsStore;
  serverSettingsService;
  multerService;
  printersStore;
  filesStore;
  printerGroupsCache;
  historyStore;
  filamentsStore;
  permissionService;
  roleService;
  userService;
  influxDbSetupService;
  pluginRepositoryCache;
  printerFloorsCache;
  pluginFirmwareUpdateService;

  constructor({
    loggerFactory,
    serverTasks,
    serverSettingsService,
    settingsStore,
    multerService,
    printersStore,
    historyStore,
    filesStore,
    printerGroupsCache,
    filamentsStore,
    permissionService,
    roleService,
    userService,
    taskManagerService,
    influxDbSetupService,
    pluginRepositoryCache,
    printerFloorsCache,
    pluginFirmwareUpdateService,
  }) {
    this.#serverTasks = serverTasks;
    this.serverSettingsService = serverSettingsService;
    this.settingsStore = settingsStore;
    this.multerService = multerService;
    this.printersStore = printersStore;
    this.filesStore = filesStore;
    this.printerGroupsCache = printerGroupsCache;
    this.historyStore = historyStore;
    this.filamentsStore = filamentsStore;
    this.permissionService = permissionService;
    this.roleService = roleService;
    this.userService = userService;
    this.#taskManagerService = taskManagerService;
    this.influxDbSetupService = influxDbSetupService;
    this.pluginRepositoryCache = pluginRepositoryCache;
    this.printerFloorsCache = printerFloorsCache;
    this.pluginFirmwareUpdateService = pluginFirmwareUpdateService;
    this.#logger = loggerFactory("Server");
  }

  async runOnce() {
    // To cope with retries after failures we register this task - disabled
    this.#taskManagerService.registerJobOrTask(this.#serverTasks.SERVER_BOOT_TASK);

    await this.run(true);
  }

  async run(bootTaskScheduler = false) {
    try {
      await this.createConnection();
    } catch (e) {
      if (e instanceof MongooseError) {
        // Tests should just continue
        if (
          !e.message.includes(
            "Can't call `openUri()` on an active connection with different connection strings."
          )
        ) {
          if (e.message.includes("ECONNREFUSED")) {
            this.#logger.error("Database connection timed-out. Retrying in 5000.");
          }
          this.#taskManagerService.scheduleDisabledJob(DITokens.bootTask, false);
          return;
        }
      }
    }

    this.#logger.info("Loading Server settings.");
    await this.settingsStore.loadSettings();

    this.#logger.info("Loading caches.");
    await this.multerService.clearUploadsFolder();
    await this.printersStore.loadPrintersStore();
    await this.filesStore.loadFilesStore();
    await this.filamentsStore.loadFilamentsStore();
    await this.historyStore.loadHistoryStore();
    await this.printerGroupsCache.loadCache();
    await this.influxDbSetupService.optionalInfluxDatabaseSetup();

    this.#logger.info("Synchronizing user permission and roles definition");
    await this.permissionService.syncPermissions();
    await this.roleService.syncRoles();
    await this.ensureAdminUserExists();

    if (bootTaskScheduler && process.env.SAFEMODE_ENABLED !== "true") {
      this.#serverTasks.BOOT_TASKS.forEach((task) => {
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
      serverSelectionTimeoutMS: 1500,
    });
  }

  async ensureAdminUserExists() {
    const adminRole = this.roleService.getRoleByName(ROLES.ADMIN);
    const administrators = await this.userService.findByRoleId(adminRole.id);
    if (!administrators?.length) {
      await this.userService.register({
        username: "root",
        name: "Admin",
        password: "fdm-root",
        roles: [adminRole.id],
      });
      this.#logger.info(
        "Created admin account as it was missing. Please consult the documentation for credentials."
      );
    }
  }
}

module.exports = BootTask;
