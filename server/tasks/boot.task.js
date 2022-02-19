import mongoose from "mongoose";
import server from "../server.env";
import DITokens from "../container.tokens";
import MongooseError from "mongoose/lib/error/mongooseError";
import authorization from "../constants/authorization.constants";
const { fetchMongoDBConnectionString, runMigrations } = server;
const { ROLES } = authorization;
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
    filamentCache;
    permissionService;
    roleService;
    userService;
    influxDbSetupService;
    constructor({ loggerFactory, serverTasks, serverSettingsService, settingsStore, multerService, printersStore, historyStore, filesStore, printerGroupsCache, filamentCache, permissionService, roleService, userService, taskManagerService, influxDbSetupService }) {
        this.#serverTasks = serverTasks;
        this.serverSettingsService = serverSettingsService;
        this.settingsStore = settingsStore;
        this.multerService = multerService;
        this.printersStore = printersStore;
        this.filesStore = filesStore;
        this.printerGroupsCache = printerGroupsCache;
        this.historyStore = historyStore;
        this.filamentCache = filamentCache;
        this.permissionService = permissionService;
        this.roleService = roleService;
        this.userService = userService;
        this.#taskManagerService = taskManagerService;
        this.influxDbSetupService = influxDbSetupService;
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
            await this.migrateDatabase();
        }
        catch (e) {
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
        this.#logger.info("Loading Server settings.");
        await this.settingsStore.loadSettings();
        this.#logger.info("Loading caches.");
        await this.multerService.clearUploadsFolder();
        await this.printersStore.loadPrintersStore();
        await this.filesStore.loadFilesStore();
        await this.historyStore.loadHistoryStore();
        await this.printerGroupsCache.loadCache();
        await this.filamentCache.initCache();
        await this.influxDbSetupService.optionalInfluxDatabaseSetup();
        this.#logger.info("Synchronizing user permission and roles definition");
        await this.permissionService.syncPermissions();
        await this.roleService.syncRoles();
        await this.ensureAdminUserExists();
        if (bootTaskScheduler && process.env.SAFEMODE_ENABLED !== "true") {
            this.#serverTasks.BOOT_TASKS.forEach((task) => {
                this.#taskManagerService.registerJobOrTask(task);
            });
        }
        else {
            this.#logger.warning("Starting in safe mode due to SAFEMODE_ENABLED");
        }
        // Success so we disable this task
        this.#taskManagerService.disableJob(DITokens.bootTask, false);
    }
    async createConnection() {
        await mongoose.connect(fetchMongoDBConnectionString(), {
            serverSelectionTimeoutMS: 1500
        });
    }
    async ensureAdminUserExists() {
        const adminRole = this.roleService.getRoleByName(ROLES.ADMIN);
        const administrators = await this.userService.findByRoleId(adminRole.id);
        if (!administrators?.length) {
            await this.userService.register({
                username: "root",
                name: "Admin",
                password: "3dhub-root",
                roles: [adminRole.id]
            });
            this.#logger.info("Created admin account as it was missing. Please consult the documentation for credentials.");
        }
    }
    async migrateDatabase() {
        await runMigrations(mongoose.connection.db, mongoose.connection.getClient());
    }
}
export default BootTask;
