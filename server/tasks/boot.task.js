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
  permissionService;
  roleService;
  userService;
  pluginRepositoryCache;
  floorCache;
  pluginFirmwareUpdateService;
  clientBundleService;

  constructor({
    loggerFactory,
    serverTasks,
    serverSettingsService,
    settingsStore,
    multerService,
    printersStore,
    filesStore,
    permissionService,
    roleService,
    userService,
    taskManagerService,
    pluginRepositoryCache,
    floorCache,
    pluginFirmwareUpdateService,
    clientBundleService,
  }) {
    this.#serverTasks = serverTasks;
    this.serverSettingsService = serverSettingsService;
    this.settingsStore = settingsStore;
    this.multerService = multerService;
    this.printersStore = printersStore;
    this.filesStore = filesStore;
    this.permissionService = permissionService;
    this.roleService = roleService;
    this.userService = userService;
    this.#taskManagerService = taskManagerService;
    this.pluginRepositoryCache = pluginRepositoryCache;
    this.floorCache = floorCache;
    this.pluginFirmwareUpdateService = pluginFirmwareUpdateService;
    this.#logger = loggerFactory("Server");
    this.clientBundleService = clientBundleService;
  }

  async runOnce() {
    // To cope with retries after failures we register this task - disabled
    this.#taskManagerService.registerJobOrTask(this.#serverTasks.SERVER_BOOT_TASK);

    await this.run(true);
  }

  async run(bootTaskScheduler = false) {
    try {
      await this.createConnection();
      await this.migrateDatabase();
    } catch (e) {
      if (e instanceof MongooseError) {
        // Tests should just continue
        if (!e.message.includes("Can't call `openUri()` on an active connection with different connection strings.")) {
          if (e.message.includes("ECONNREFUSED")) {
            this.#logger.error("Database connection timed-out. Retrying in 5000.");
          }
          this.#taskManagerService.scheduleDisabledJob(DITokens.bootTask, false);
          return;
        }
      }
    }

    await this.clientBundleService.downloadBundle().catch((e) => {
      this.#logger.error(`Error downloading latest client bundle: ${e.message} (${e.status})`);
    });

    this.#logger.info("Loading Server settings.");
    await this.settingsStore.loadSettings();

    this.#logger.info("Loading caches.");
    await this.multerService.clearUploadsFolder();
    await this.printersStore.loadPrintersStore();
    await this.filesStore.loadFilesStore();
    await this.floorCache.loadCache();

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
      this.#logger.info("Created admin account as it was missing. Please consult the documentation for credentials.");
    }
  }

  async migrateDatabase() {
    await runMigrations(mongoose.connection.db, mongoose.connection.getClient());
  }
}

module.exports = BootTask;
