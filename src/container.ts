import { Octokit } from "octokit";
import { asClass, asFunction, asValue, createContainer, InjectionMode, Resolver } from "awilix";
import { ToadScheduler } from "toad-scheduler";
import { DITokens } from "./container.tokens";
import { PrinterService as PrinterService } from "./services/orm/printer.service";
import { SettingsStore } from "./state/settings.store";
import { ServerReleaseService } from "./services/core/server-release.service";
import { TaskManagerService } from "./services/core/task-manager.service";
import { GithubService } from "./services/core/github.service";
import { FileCache } from "./state/file.cache";
import { PrinterWebsocketTask } from "./tasks/printer-websocket.task";
import { SocketIoTask } from "./tasks/socketio.task";
import { SocketFactory } from "./services/socket.factory";
import { PrinterFilesStore } from "./state/printer-files.store";
import { configureEventEmitter } from "./handlers/event-emitter";
import { AppConstants } from "./server.constants";
import { SoftwareUpdateTask } from "./tasks/software-update.task";
import { LoggerFactory } from "./handlers/logger-factory";
import { MulterService } from "./services/core/multer.service";
import { FileUploadTrackerCache } from "./state/file-upload-tracker.cache";
import { ServerHost } from "./server.host";
import { BootTask } from "./tasks/boot.task";
import { UserService as UserService } from "./services/orm/user.service";
import { RoleService as RoleService } from "./services/orm/role.service";
import { PermissionService as PermissionService } from "./services/orm/permission.service";
import { PrinterFileCleanTask } from "./tasks/printer-file-clean.task";
import { ROLES } from "./constants/authorization.constants";
import { CustomGcodeService as CustomGcodeService } from "./services/orm/custom-gcode.service";
import { PrinterWebsocketRestoreTask } from "./tasks/printer-websocket-restore.task";
import { ConfigService } from "./services/core/config.service";
import { PrintCompletionSocketIoTask } from "./tasks/print-completion.socketio.task";
import { PrintCompletionService as PrintCompletionService } from "./services/orm/print-completion.service";
import { SocketIoGateway } from "./state/socket-io.gateway";
import { ClientBundleService } from "./services/core/client-bundle.service";
import { FloorStore } from "./state/floor.store";
import { YamlService } from "./services/core/yaml.service";
import { MonsterPiService } from "./services/core/monsterpi.service";
import { BatchCallService } from "./services/core/batch-call.service";
import { ClientDistDownloadTask } from "./tasks/client-bundle.task";
import { OctoprintWebsocketAdapter } from "./services/octoprint/octoprint-websocket.adapter";
import { PrinterCache } from "./state/printer.cache";
import { PrinterSocketStore } from "./state/printer-socket.store";
import { TestPrinterSocketStore } from "./state/test-printer-socket.store";
import { PrinterEventsCache } from "./state/printer-events.cache";
import { LogDumpService } from "./services/core/logs-manager.service";
import { CameraStreamService as CameraService } from "./services/orm/camera-stream.service";
import { JwtService } from "./services/authentication/jwt.service";
import { AuthService } from "./services/authentication/auth.service";
import { throttling } from "@octokit/plugin-throttling";
import { RefreshTokenService as RefreshToken } from "@/services/orm/refresh-token.service";
import { SettingsService } from "@/services/orm/settings.service";
import { FloorService as FloorService } from "@/services/orm/floor.service";
import { FloorPositionService } from "@/services/orm/floor-position.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { BuildResolver, DisposableResolver } from "awilix/lib/resolvers";
import { UserRoleService } from "@/services/orm/user-role.service";
import { PrinterGroupService } from "@/services/orm/printer-group.service";
import { MoonrakerClient } from "@/services/moonraker/moonraker.client";
import { MoonrakerWebsocketAdapter } from "@/services/moonraker/moonraker-websocket.adapter";
import { OctoprintApi } from "@/services/octoprint.api";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { MoonrakerApi } from "@/services/moonraker.api";
import { PrinterApiFactory } from "@/services/printer-api.factory";
import { PrinterThumbnailCache } from "@/state/printer-thumbnail.cache";
import { HttpClientFactory } from "@/services/core/http-client.factory";

export function configureContainer() {
  // Create the container and set the injectionMode to PROXY (which is also the default).
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  const di = DITokens;

  container.register({
    // -- asValue/asFunction constants --
    [di.appDefaultRole]: asValue(ROLES.GUEST),
    [di.appDefaultRoleNoLogin]: asValue(ROLES.ADMIN),
    [di.serverVersion]: asFunction(() => {
      return process.env[AppConstants.VERSION_KEY];
    }),
    [di.socketFactory]: asClass(SocketFactory).transient(), // Factory function, transient on purpose!

    [di.typeormService]: asClass(TypeormService).singleton(),
    [di.settingsService]: asClass(SettingsService).singleton(),
    [di.floorService]: asClass(FloorService).singleton(),
    [di.floorPositionService]: asClass(FloorPositionService).singleton(),
    [di.cameraStreamService]: asClass(CameraService).singleton(),
    [di.printerService]: asClass(PrinterService).singleton(),
    [di.printerGroupService]: asClass(PrinterGroupService).singleton(),
    [di.refreshTokenService]: asClass(RefreshToken).singleton(),
    [di.userService]: asClass(UserService).singleton(),
    [di.userRoleService]: asClass(UserRoleService).singleton(),
    [di.roleService]: asClass(RoleService).singleton(),
    [di.permissionService]: asClass(PermissionService).singleton(),
    [di.customGCodeService]: asClass(CustomGcodeService).singleton(),
    [di.printCompletionService]: asClass(PrintCompletionService).singleton(),
    [di.serverHost]: asClass(ServerHost).singleton(),
    [di.settingsStore]: asClass(SettingsStore).singleton(),
    [di.configService]: asClass(ConfigService),
    [di.authService]: asClass(AuthService).singleton(),
    [di.jwtService]: asClass(JwtService).singleton(),

    [di.loggerFactory]: asFunction(LoggerFactory).transient(),
    [di.taskManagerService]: asClass(TaskManagerService).singleton(),
    [di.toadScheduler]: asClass(ToadScheduler).singleton(),
    [di.eventEmitter2]: asFunction(configureEventEmitter).singleton(),
    [di.serverReleaseService]: asClass(ServerReleaseService).singleton(),
    [di.monsterPiService]: asClass(MonsterPiService).singleton(),
    [di.githubService]: asClass(GithubService),
    [di.octokitService]: asFunction((cradle: any) => {
      const config = cradle.configService;
      const CustomOctoKit = Octokit.plugin(throttling);
      return new CustomOctoKit({
        auth: config.get(AppConstants.GITHUB_PAT),
        throttle: {
          onRateLimit: (retryAfter, options, octokit, retryCount) => {
            const logger = LoggerFactory()("OctoKitThrottle");
            logger.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
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
    [di.httpClientFactory]: asClass(HttpClientFactory),
    [di.socketIoGateway]: asClass(SocketIoGateway).singleton(),
    [di.multerService]: asClass(MulterService).singleton(),
    [di.yamlService]: asClass(YamlService),
    [di.printerLogin]: asValue(null), // Fallback when no scope is provided
    [di.printerApiFactory]: asClass(PrinterApiFactory).transient(), // Factory function, transient on purpose!
    [di.octoprintApi]: asClass(OctoprintApi).transient(), // Transient on purpose
    [di.octoprintClient]: asClass(OctoprintClient).singleton(),
    [di.octoPrintSockIoAdapter]: asClass(OctoprintWebsocketAdapter).transient(), // Transient on purpose
    [di.moonrakerApi]: asClass(MoonrakerApi).transient(), // Transient on purpose
    [di.moonrakerClient]: asClass(MoonrakerClient).singleton(),
    [di.moonrakerWebsocketAdapter]: asClass(MoonrakerWebsocketAdapter).transient(), // Transient on purpose
    [di.batchCallService]: asClass(BatchCallService).singleton(),

    [di.floorStore]: asClass(FloorStore).singleton(),
    [di.printerThumbnailCache]: asClass(PrinterThumbnailCache).singleton(),
    [di.fileCache]: asClass(FileCache).singleton(),
    [di.fileUploadTrackerCache]: asClass(FileUploadTrackerCache).singleton(),
    [di.printerFilesStore]: asClass(PrinterFilesStore).singleton(),
    [di.printerCache]: asClass(PrinterCache).singleton(),
    [di.printerEventsCache]: asClass(PrinterEventsCache).singleton(),
    [di.printerSocketStore]: asClass(PrinterSocketStore).singleton(),
    [di.testPrinterSocketStore]: asClass(TestPrinterSocketStore).singleton(),

    [di.bootTask]: asClass(BootTask),
    [di.softwareUpdateTask]: asClass(SoftwareUpdateTask), // Provided SSE handlers (couplers) shared with controllers
    [di.socketIoTask]: asClass(SocketIoTask).singleton(), // This task is a quick task (~100ms per printer)
    [di.clientDistDownloadTask]: asClass(ClientDistDownloadTask).singleton(),
    [di.printCompletionSocketIoTask]: asClass(PrintCompletionSocketIoTask).singleton(),
    [di.printerWebsocketTask]: asClass(PrinterWebsocketTask).singleton(), // This task is a recurring heartbeat task
    [di.printerWebsocketRestoreTask]: asClass(PrinterWebsocketRestoreTask).singleton(), // Task aimed at testing the printer API
    [di.printerFileCleanTask]: asClass(PrinterFileCleanTask).singleton(),
  });

  return container;
}
