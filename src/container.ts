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
import { FilesStore } from "./state/files.store";
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

export function configureContainer() {
  // Create the container and set the injectionMode to PROXY (which is also the default).
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  container.register({
    // -- asValue/asFunction constants --
    [DITokens.serverTasks]: asValue(ServerTasks),
    [DITokens.appDefaultRole]: asValue(ROLES.GUEST),
    [DITokens.appDefaultRoleNoLogin]: asValue(ROLES.ADMIN),
    [DITokens.serverVersion]: asFunction(() => {
      return process.env[AppConstants.VERSION_KEY];
    }),
    [DITokens.socketFactory]: asClass(SocketFactory).transient(), // Factory function, transient on purpose!

    // -- asClass --
    [DITokens.serverHost]: asClass(ServerHost).singleton(),
    [DITokens.settingsStore]: asClass(SettingsStore).singleton(),
    [DITokens.settingsService]: asClass(SettingsService),
    [DITokens.configService]: asClass(ConfigService),
    [DITokens.authService]: asClass(AuthService).singleton(),
    [DITokens.refreshTokenService]: asClass(RefreshTokenService).singleton(),
    [DITokens.userService]: asClass(UserService),
    [DITokens.roleService]: asClass(RoleService).singleton(), // caches roles
    [DITokens.permissionService]: asClass(PermissionService).singleton(),
    [DITokens.jwtService]: asClass(JwtService).singleton(),

    [DITokens.loggerFactory]: asFunction(LoggerFactory).transient(),
    [DITokens.taskManagerService]: asClass(TaskManagerService).singleton(),
    [DITokens.toadScheduler]: asClass(ToadScheduler).singleton(),
    [DITokens.eventEmitter2]: asFunction(configureEventEmitter).singleton(),
    [DITokens.cacheManager]: asFunction(configureCacheManager).singleton(),
    [DITokens.serverReleaseService]: asClass(ServerReleaseService).singleton(),
    [DITokens.monsterPiService]: asClass(MonsterPiService).singleton(),
    [DITokens.serverUpdateService]: asClass(ServerUpdateService).singleton(),
    [DITokens.githubService]: asClass(GithubService),
    [DITokens.octokitService]: asFunction((cradle: any) => {
      const config = cradle.configService;
      // cradle.
      return new Octokit({
        auth: config.get(AppConstants.GITHUB_PAT),
      });
    }),
    [DITokens.clientBundleService]: asClass(ClientBundleService),
    [DITokens.logDumpService]: asClass(LogDumpService),
    [DITokens.simpleGitService]: asValue(simpleGit()),
    [DITokens.httpClient]: asValue(
      axios.create({
        maxBodyLength: 1000 * 1000 * 1000, // 1GB
        maxContentLength: 1000 * 1000 * 1000, // 1GB
      })
    ),

    [DITokens.socketIoGateway]: asClass(SocketIoGateway).singleton(),
    [DITokens.multerService]: asClass(MulterService).singleton(),
    [DITokens.printerService]: asClass(PrinterService),
    [DITokens.printerFilesService]: asClass(PrinterFilesService),
    [DITokens.floorService]: asClass(FloorService).singleton(),
    [DITokens.yamlService]: asClass(YamlService),
    [DITokens.printCompletionService]: asClass(PrintCompletionService).singleton(),
    [DITokens.octoPrintApiService]: asClass(OctoPrintApiService).singleton(),
    [DITokens.cameraStreamService]: asClass(CameraStreamService),
    [DITokens.batchCallService]: asClass(BatchCallService).singleton(),
    [DITokens.pluginFirmwareUpdateService]: asClass(PluginFirmwareUpdateService).singleton(),
    [DITokens.octoPrintSockIoAdapter]: asClass(OctoPrintSockIoAdapter).transient(), // Transient on purpose
    [DITokens.floorStore]: asClass(FloorStore).singleton(),
    [DITokens.pluginRepositoryCache]: asClass(PluginRepositoryCache).singleton(),

    [DITokens.fileCache]: asClass(FileCache).singleton(),
    [DITokens.fileUploadTrackerCache]: asClass(FileUploadTrackerCache).singleton(),
    [DITokens.filesStore]: asClass(FilesStore).singleton(),
    [DITokens.printerCache]: asClass(PrinterCache).singleton(),
    [DITokens.printerEventsCache]: asClass(PrinterEventsCache).singleton(),
    [DITokens.printerSocketStore]: asClass(PrinterSocketStore).singleton(),
    [DITokens.testPrinterSocketStore]: asClass(TestPrinterSocketStore).singleton(),

    // Extensibility and export
    [DITokens.customGCodeService]: asClass(CustomGcodeService),
    [DITokens.influxDbV2BaseService]: asClass(InfluxDbV2BaseService),

    [DITokens.bootTask]: asClass(BootTask),
    [DITokens.softwareUpdateTask]: asClass(SoftwareUpdateTask), // Provided SSE handlers (couplers) shared with controllers
    [DITokens.socketIoTask]: asClass(SocketIoTask).singleton(), // This task is a quick task (~100ms per printer)
    [DITokens.clientDistDownloadTask]: asClass(ClientDistDownloadTask).singleton(),
    [DITokens.printCompletionSocketIoTask]: asClass(PrintCompletionSocketIoTask).singleton(),
    [DITokens.printerWebsocketTask]: asClass(PrinterWebsocketTask).singleton(), // This task is a recurring heartbeat task
    [DITokens.printerWebsocketRestoreTask]: asClass(PrinterWebsocketRestoreTask).singleton(), // Task aimed at testing the printer API
    [DITokens.printerFileCleanTask]: asClass(PrinterFileCleanTask).singleton(),
  });

  return container;
}
