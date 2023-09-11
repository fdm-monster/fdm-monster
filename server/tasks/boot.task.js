const mongoose = require("mongoose");

const { fetchMongoDBConnectionString, runMigrations } = require("../server.env");
const DITokens = require("../container.tokens");
const MongooseError = require("mongoose/lib/error/mongooseError");
const { ROLES } = require("../constants/authorization.constants");
const { AppConstants } = require("../server.constants");

class BootTask {
  logger;
  taskManagerService;
  serverTasks;
  /**
   * @type {SettingsStore}
   */
  settingsStore;
  /**
   * @type {SettingsService}
   */
  settingsService;
  multerService;
  /**
   * @type {PrinterSocketStore}
   */
  printerSocketStore;
  /**
   * @type {FilesStore}
   */
  filesStore;
  /**
   * @type {PermissionService}
   */
  permissionService;
  /**
   * @type {RoleService}
   */
  roleService;
  /**
   * @type {UserService}
   */
  userService;
  /**
   * @type {PluginRepositoryCache}
   */
  pluginRepositoryCache;
  floorStore;
  pluginFirmwareUpdateService;
  /**
   * @type {ClientBundleService}
   */
  clientBundleService;
  /**
   * @type {ConfigService}
   */
  configService;

  constructor({
    loggerFactory,
    serverTasks,
    settingsService,
    settingsStore,
    multerService,
    printerSocketStore,
    filesStore,
    permissionService,
    roleService,
    userService,
    taskManagerService,
    pluginRepositoryCache,
    floorStore,
    pluginFirmwareUpdateService,
    clientBundleService,
    configService,
  }) {
    this.serverTasks = serverTasks;
    this.settingsService = settingsService;
    this.settingsStore = settingsStore;
    this.multerService = multerService;
    this.printerSocketStore = printerSocketStore;
    this.filesStore = filesStore;
    this.permissionService = permissionService;
    this.roleService = roleService;
    this.userService = userService;
    this.taskManagerService = taskManagerService;
    this.pluginRepositoryCache = pluginRepositoryCache;
    this.floorStore = floorStore;
    this.pluginFirmwareUpdateService = pluginFirmwareUpdateService;
    this.logger = loggerFactory(BootTask.name);
    this.clientBundleService = clientBundleService;
    this.configService = configService;
  }

  async runOnce() {
    // To cope with retries after failures we register this task - disabled
    this.taskManagerService.registerJobOrTask(this.serverTasks.SERVER_BOOT_TASK);

    this.logger.log("Running boot task once.");
    await this.run();
  }

  async run() {
    try {
      await this.createConnection();
      await this.migrateDatabase();
    } catch (e) {
      if (e instanceof MongooseError) {
        // Tests should just continue
        if (!e.message.includes("Can't call `openUri()` on an active connection with different connection strings.")) {
          // We are not in a test
          if (e.message.includes("ECONNREFUSED")) {
            this.logger.error("Database connection timed-out. Retrying in 5000.");
          } else {
            this.logger.error(`Database connection error: ${e.message}`);
          }
          this.taskManagerService.scheduleDisabledJob(DITokens.bootTask, false);
          return;
        }
      }
    }

    this.logger.log("Loading and synchronizing Server Settings");
    await this.settingsStore.loadSettings();
    const loginRequired = this.configService.get(AppConstants.OVERRIDE_LOGIN_REQUIRED, "false") === "true";
    await this.settingsStore.setLoginRequired(loginRequired);
    const registrationEnabled = this.configService.get(AppConstants.OVERRIDE_REGISTRATION_ENABLED, "false") === "true";
    await this.settingsStore.setRegistrationEnabled(registrationEnabled);

    const overrideJwtSecret = this.configService.get(AppConstants.OVERRIDE_JWT_SECRET, undefined);
    const overrideJwtExpiresIn = this.configService.get(AppConstants.OVERRIDE_JWT_EXPIRES_IN, undefined);
    await this.settingsStore.persistOptionalCredentialSettings(overrideJwtSecret, overrideJwtExpiresIn);

    this.logger.log("Clearing upload folder");
    await this.multerService.clearUploadsFolder();
    this.logger.log("Loading printer sockets");
    await this.printerSocketStore.loadPrinterSockets(); // New sockets
    this.logger.log("Loading files store");
    await this.filesStore.loadFilesStore();
    this.logger.log("Loading floor store");
    await this.floorStore.loadStore();

    this.logger.log("Synchronizing user permission and roles definition");
    await this.permissionService.syncPermissions();
    await this.roleService.syncRoles();

    if (process.env.SAFEMODE_ENABLED === "true") {
      this.logger.warn("Starting in safe mode due to SAFEMODE_ENABLED");
    } else {
      this.serverTasks.BOOT_TASKS.forEach((task) => {
        this.taskManagerService.registerJobOrTask(task);
      });
    }

    // Success so we disable this task
    this.taskManagerService.disableJob(DITokens.bootTask, false);
  }

  async createConnection() {
    await mongoose.connect(fetchMongoDBConnectionString(), {
      serverSelectionTimeoutMS: 1500,
    });
  }

  async migrateDatabase() {
    await runMigrations(mongoose.connection.db, mongoose.connection.getClient());
  }
}

module.exports = BootTask;
