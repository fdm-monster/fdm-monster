import { DITokens } from "@/container.tokens";
import { AppConstants } from "@/server.constants";
import { LoggerService } from "@/handlers/logger";
import { TaskManagerService } from "@/services/task-manager.service";
import { ServerTasks } from "@/tasks";
import { MulterService } from "@/services/core/multer.service";
import { SettingsStore } from "@/state/settings.store";
import { FloorStore } from "@/state/floor.store";
import { ConfigService } from "@/services/core/config.service";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterThumbnailCache } from "@/state/printer-thumbnail.cache";
import { TaskService } from "@/services/interfaces/task.interfaces";
import { RoleService } from "@/services/orm/role.service";
import { UserService } from "@/services/orm/user.service";
import { PermissionService } from "@/services/orm/permission.service";
import { RoleName } from "@/constants/authorization.constants";

export class BootTask implements TaskService {
  logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly taskManagerService: TaskManagerService,
    private readonly settingsStore: SettingsStore,
    private readonly multerService: MulterService,
    private readonly printerSocketStore: PrinterSocketStore,
    private readonly printerFilesStore: PrinterFilesStore,
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly floorStore: FloorStore,
    private readonly configService: ConfigService,
    private readonly typeormService: TypeormService,
    private readonly printerThumbnailCache: PrinterThumbnailCache,
  ) {
    this.logger = loggerFactory(BootTask.name);
  }

  async runOnce() {
    // To cope with retries after failures we register this task - disabled
    this.taskManagerService.registerJobOrTask(ServerTasks.SERVER_BOOT_TASK);

    this.logger.log("Running boot task once.");
    await this.run();
  }

  async run() {
    await this.typeormService.createConnection();

    this.logger.log("Loading and synchronizing Server Settings");
    await this.settingsStore.loadSettings();

    this.logger.log("Synchronizing user permission and roles definition");
    await this.permissionService.syncPermissions();
    await this.roleService.syncRoles();

    const isDemoMode = this.configService.isDemoMode();
    if (isDemoMode) {
      this.logger.warn(`Starting in demo mode due to ${AppConstants.OVERRIDE_IS_DEMO_MODE}`);
      await this.createOrUpdateDemoAccount();
      this.logger.warn(
        `Setting loginRequired=true and registration=false due to ${AppConstants.OVERRIDE_IS_DEMO_MODE}`,
      );
      await this.settingsStore.setLoginRequired(true);
      await this.settingsStore.setRegistrationEnabled(false);
    } else {
      const loginRequired = this.configService.get<string | null>(AppConstants.OVERRIDE_LOGIN_REQUIRED, null);
      if (loginRequired !== null) {
        this.logger.warn(`Setting login required due to ${AppConstants.OVERRIDE_LOGIN_REQUIRED}`);
        await this.settingsStore.setLoginRequired(loginRequired === "true");
      }

      const registrationEnabled = this.configService.get(AppConstants.OVERRIDE_REGISTRATION_ENABLED, null);
      if (registrationEnabled !== null) {
        this.logger.warn(`Setting registration enabled due to ${AppConstants.OVERRIDE_REGISTRATION_ENABLED}`);
        await this.settingsStore.setRegistrationEnabled(registrationEnabled === "true");
      }
    }

    const overrideJwtSecret = this.configService.get<string>(AppConstants.OVERRIDE_JWT_SECRET);
    const overrideJwtExpiresIn = this.configService.get<string>(AppConstants.OVERRIDE_JWT_EXPIRES_IN);
    await this.settingsStore.persistOptionalCredentialSettings(overrideJwtSecret, overrideJwtExpiresIn);

    this.logger.log("Clearing upload folder");
    this.multerService.clearUploadsFolder();
    this.logger.log("Loading printer sockets");
    await this.printerSocketStore.loadPrinterSockets(); // New sockets
    this.logger.log("Loading files store");
    await this.printerFilesStore.loadFilesStore();
    this.logger.log("Loading floor store");
    await this.floorStore.loadStore();
    this.logger.log("Loading printer thumbnail cache");
    await this.printerThumbnailCache.loadCache();
    const length = await this.printerThumbnailCache.getAllValues();
    this.logger.log(`Loaded ${length.length} thumbnail(s)`);

    if (process.env.SAFEMODE_ENABLED === "true") {
      this.logger.warn("Starting in safe mode due to SAFEMODE_ENABLED");
    } else {
      ServerTasks.BOOT_TASKS.forEach((task) => {
        this.taskManagerService.registerJobOrTask(task);
      });
    }

    // Success so we disable this task
    this.taskManagerService.disableJob(DITokens.bootTask, false);
  }

  async createOrUpdateDemoAccount() {
    const demoUsername = this.configService.get(
      AppConstants.OVERRIDE_DEMO_USERNAME,
      AppConstants.DEFAULT_DEMO_USERNAME,
    ) as string;
    const demoPassword = this.configService.get(
      AppConstants.OVERRIDE_DEMO_PASSWORD,
      AppConstants.DEFAULT_DEMO_PASSWORD,
    ) as string;
    const demoRole = this.configService.get(
      AppConstants.OVERRIDE_DEMO_ROLE,
      AppConstants.DEFAULT_DEMO_ROLE,
    ) as RoleName;

    const demoUserId = await this.userService.getDemoUserId();
    if (!demoUserId) {
      await this.userService.register({
        username: demoUsername,
        password: demoPassword,
        isDemoUser: true,
        isVerified: true,
        isRootUser: false,
        needsPasswordChange: false,
        roles: [demoRole],
      });
      this.logger.log("Created demo account");
    } else {
      await this.userService.setVerifiedById(demoUserId, true);
      await this.userService.setIsRootUserById(demoUserId, false);
      await this.userService.updatePasswordUnsafeByUsername(demoUsername, demoPassword);
      await this.userService.setUserRoles(demoUserId, [demoRole]);
      this.logger.log("Updated demo account");
    }
  }
}
