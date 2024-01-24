import axios from "axios";
import simpleGit from "simple-git";
import { Octokit } from "octokit";
import { asClass, asFunction, asValue, createContainer, InjectionMode } from "awilix";
import { ToadScheduler } from "toad-scheduler";
import { DITokens } from "./container.tokens";
import { PrinterService } from "./services/printer.service";
import { SettingsStore } from "./state/settings.store";
import { SettingsService } from "./services/settings.service";
import { ServerReleaseService } from "./services/core/server-release.service";
import { TaskManagerService } from "./services/core/task-manager.service";
import { ServerUpdateService } from "./services/core/server-update.service";
import { GithubService } from "./services/core/github.service";
import { FileCache } from "./state/file.cache";
import { PrinterWebsocketTask } from "./tasks/printer-websocket.task";
import { SocketIoTask } from "./tasks/socketio.task";
import { OctoPrintApiService } from "./services/octoprint/octoprint-api.service";
import { SocketFactory } from "./services/octoprint/socket.factory";
import { PrinterFilesStore } from "./state/printer-files.store";
import { configureEventEmitter } from "./handlers/event-emitter";
import { AppConstants } from "./server.constants";
import { PrinterFilesService } from "./services/printer-files.service";
import { SoftwareUpdateTask } from "./tasks/software-update.task";
import { LoggerFactory } from "./handlers/logger-factory";
import { MulterService } from "./services/core/multer.service";
import { FileUploadTrackerCache } from "./state/file-upload-tracker.cache";
import { ServerHost } from "./server.host";
import { BootTask } from "./tasks/boot.task";
import { UserService } from "./services/authentication/user.service";
import { RoleService } from "./services/authentication/role.service";
import { ServerTasks } from "./tasks";
import { PermissionService } from "./services/authentication/permission.service";
import { PrinterFileCleanTask } from "./tasks/printer-file-clean.task";
import { ROLES } from "./constants/authorization.constants";
import { CustomGcodeService } from "./services/custom-gcode.service";
import { PrinterWebsocketRestoreTask } from "./tasks/printer-websocket-restore.task";
import { PluginFirmwareUpdateService } from "./services/octoprint/plugin-firmware-update.service";
import { PluginRepositoryCache } from "./services/octoprint/plugin-repository.cache";
import { configureCacheManager } from "./handlers/cache-manager";
import { InfluxDbV2BaseService } from "./services/influxdb-v2/influx-db-v2-base.service";
import { ConfigService } from "./services/core/config.service";
import { PrintCompletionSocketIoTask } from "./tasks/print-completion.socketio.task";
import { PrintCompletionService } from "./services/print-completion.service";
import { SocketIoGateway } from "./state/socket-io.gateway";
import { ClientBundleService } from "./services/core/client-bundle.service";
import { FloorService } from "./services/floor.service";
import { FloorStore } from "./state/floor.store";
import { YamlService } from "./services/core/yaml.service";
import { MonsterPiService } from "./services/core/monsterpi.service";
import { BatchCallService } from "./services/batch-call.service";
import { ClientDistDownloadTask } from "./tasks/client-bundle.task";
import { OctoPrintSockIoAdapter } from "./services/octoprint/octoprint-sockio.adapter";
import { PrinterCache } from "./state/printer.cache";
import { PrinterSocketStore } from "./state/printer-socket.store";
import { TestPrinterSocketStore } from "./state/test-printer-socket.store";
import { PrinterEventsCache } from "./state/printer-events.cache";
import { LogDumpService } from "./services/core/logs-manager.service";
import { CameraStreamService } from "./services/camera-stream.service";
import { JwtService } from "./services/authentication/jwt.service";
import { AuthService } from "./services/authentication/auth.service";
import { RefreshTokenService } from "@/services/authentication/refresh-token.service";
import { throttling } from "@octokit/plugin-throttling";
import { PrinterDisconnectedPollTask } from "@/tasks/printer-disconnected-poll.task";

export function configureContainer() {
  // Create the container and set the injectionMode to PROXY (which is also the default).
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  const isSqlite = false;
  const di = DITokens;

  container.register({
    // -- asValue/asFunction constants --
    [di.serverTasks]: asValue(ServerTasks),
    [di.isTypeormMode]: asValue(isSqlite),
    // TODO change the role to a non-admin role in the future once GUEST/OPERATOR have more meaningful permissions
    [di.appDefaultRole]: asValue(ROLES.ADMIN),
    [di.appDefaultRoleNoLogin]: asValue(ROLES.ADMIN),
    [di.serverVersion]: asFunction(() => {
      return process.env[AppConstants.VERSION_KEY];
    }),
    [di.socketFactory]: asClass(SocketFactory).transient(), // Factory function, transient on purpose!

    // -- asClass --
    [di.serverHost]: asClass(ServerHost).singleton(),
    [di.settingsStore]: asClass(SettingsStore).singleton(),
    [di.settingsService]: asClass(SettingsService),
    [di.configService]: asClass(ConfigService),
    [di.authService]: asClass(AuthService).singleton(),
    [di.refreshTokenService]: asClass(RefreshTokenService).singleton(),
    [di.userService]: asClass(UserService),
    [di.roleService]: asClass(RoleService).singleton(), // caches roles
    [di.permissionService]: asClass(PermissionService).singleton(),
    [di.jwtService]: asClass(JwtService).singleton(),

    [di.loggerFactory]: asFunction(LoggerFactory).transient(),
    [di.taskManagerService]: asClass(TaskManagerService).singleton(),
    [di.toadScheduler]: asClass(ToadScheduler).singleton(),
    [di.eventEmitter2]: asFunction(configureEventEmitter).singleton(),
    [di.cacheManager]: asFunction(configureCacheManager).singleton(),
    [di.serverReleaseService]: asClass(ServerReleaseService).singleton(),
    [di.monsterPiService]: asClass(MonsterPiService).singleton(),
    [di.serverUpdateService]: asClass(ServerUpdateService).singleton(),
    [di.githubService]: asClass(GithubService),
    [di.octokitService]: asFunction((cradle: any) => {
      const config = cradle.configService;
      const CustomOctoKit = Octokit.plugin(throttling);
      return new CustomOctoKit({
        auth: config.get(AppConstants.GITHUB_PAT),
        throttle: {
          onRateLimit: (retryAfter, options, octokit, retryCount) => {
            const logger = LoggerFactory()("OctoKitThrottle");
            logger.warn(`Request quota exhaustedd for request ${options.method} ${options.url}`);
          },
          onSecondaryRateLimit: (retryAfter, options, octokit) => {
            const logger = LoggerFactory()("OctoKitThrottle");
            // does not retry, only logs a warning
            logger.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
          },
        },
      });
    }),
    [di.clientBundleService]: asClass(ClientBundleService),
    [di.logDumpService]: asClass(LogDumpService),
    [di.simpleGitService]: asValue(simpleGit()),
    [di.httpClient]: asValue(
      axios.create({
        maxBodyLength: 1000 * 1000 * 1000, // 1GB
        maxContentLength: 1000 * 1000 * 1000, // 1GB
      })
    ),

    [di.socketIoGateway]: asClass(SocketIoGateway).singleton(),
    [di.multerService]: asClass(MulterService).singleton(),
    [di.printerService]: asClass(PrinterService),
    [di.printerFilesService]: asClass(PrinterFilesService),
    [di.floorService]: asClass(FloorService).singleton(),
    [di.yamlService]: asClass(YamlService),
    [di.printCompletionService]: asClass(PrintCompletionService).singleton(),
    [di.octoPrintApiService]: asClass(OctoPrintApiService).singleton(),
    [di.cameraStreamService]: asClass(CameraStreamService),
    [di.batchCallService]: asClass(BatchCallService).singleton(),
    [di.pluginFirmwareUpdateService]: asClass(PluginFirmwareUpdateService).singleton(),
    [di.octoPrintSockIoAdapter]: asClass(OctoPrintSockIoAdapter).transient(), // Transient on purpose
    [di.floorStore]: asClass(FloorStore).singleton(),
    [di.pluginRepositoryCache]: asClass(PluginRepositoryCache).singleton(),

    [di.fileCache]: asClass(FileCache).singleton(),
    [di.fileUploadTrackerCache]: asClass(FileUploadTrackerCache).singleton(),
    [di.printerFilesStore]: asClass(PrinterFilesStore).singleton(),
    [di.printerCache]: asClass(PrinterCache).singleton(),
    [di.printerEventsCache]: asClass(PrinterEventsCache).singleton(),
    [di.printerSocketStore]: asClass(PrinterSocketStore).singleton(),
    [di.testPrinterSocketStore]: asClass(TestPrinterSocketStore).singleton(),

    // Extensibility and export
    [di.customGCodeService]: asClass(CustomGcodeService),
    [di.influxDbV2BaseService]: asClass(InfluxDbV2BaseService),

    [di.bootTask]: asClass(BootTask),
    [di.softwareUpdateTask]: asClass(SoftwareUpdateTask), // Provided SSE handlers (couplers) shared with controllers
    [di.socketIoTask]: asClass(SocketIoTask).singleton(), // This task is a quick task (~100ms per printer)
    [di.clientDistDownloadTask]: asClass(ClientDistDownloadTask).singleton(),
    [di.printCompletionSocketIoTask]: asClass(PrintCompletionSocketIoTask).singleton(),
    [di.printerWebsocketTask]: asClass(PrinterWebsocketTask).singleton(), // This task is a recurring heartbeat task
    [di.printerWebsocketRestoreTask]: asClass(PrinterWebsocketRestoreTask).singleton(), // Task aimed at testing the printer API
    [di.printerDisconnectedPollTask]: asClass(PrinterDisconnectedPollTask).singleton(),
    [di.printerFileCleanTask]: asClass(PrinterFileCleanTask).singleton(),
  });

  return container;
}
