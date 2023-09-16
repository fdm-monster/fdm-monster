const axios = require("axios");
const { asFunction, asClass, asValue, createContainer, InjectionMode } = require("awilix");
const { ToadScheduler } = require("toad-scheduler");
const DITokens = require("./container.tokens");
const SimpleGitFactory = require("simple-git");
const { Octokit } = require("octokit");
const PrinterService = require("./services/printer.service");
const SettingsStore = require("./state/settings.store");
const { SettingsService } = require("./services/settings.service");
const { ServerReleaseService } = require("./services/server-release.service");
const { TaskManagerService } = require("./services/task-manager.service");
const { ServerUpdateService } = require("./services/server-update.service");
const { GithubService } = require("./services/github.service");
const FileCache = require("./state/file.cache");
const PrinterWebsocketTask = require("./tasks/printer-websocket.task");
const { SocketIoTask } = require("./tasks/socketio.task");
const OctoPrintApiService = require("./services/octoprint/octoprint-api.service");
const { SocketFactory } = require("./services/octoprint/socket.factory");
const FilesStore = require("./state/files.store");
const { configureEventEmitter } = require("./handlers/event-emitter");
const { AppConstants } = require("./server.constants");
const PrinterFilesService = require("./services/printer-files.service");
const SoftwareUpdateTask = require("./tasks/software-update.task");
const LoggerFactory = require("./handlers/logger-factory");
const MulterService = require("./services/multer.service");
const FileUploadTrackerCache = require("./state/file-upload-tracker.cache");
const ServerHost = require("./server.host");
const BootTask = require("./tasks/boot.task");
const UserService = require("./services/authentication/user.service");
const RoleService = require("./services/authentication/role.service");
const { ServerTasks } = require("./tasks");
const PermissionService = require("./services/authentication/permission.service");
const PrinterFileCleanTask = require("./tasks/printer-file-clean.task");
const { ROLES } = require("./constants/authorization.constants");
const CustomGCodeService = require("./services/custom-gcode.service");
const { PrinterWebsocketRestoreTask } = require("./tasks/printer-websocket-restore.task");
const { PluginFirmwareUpdateService } = require("./services/octoprint/plugin-firmware-update.service");
const { PluginRepositoryCache } = require("./services/octoprint/plugin-repository.cache");
const { configureCacheManager } = require("./handlers/cache-manager");
const { InfluxDbV2BaseService } = require("./services/influxdb-v2/influx-db-v2-base.service");
const { ConfigService } = require("./services/config.service");
const { PrintCompletionSocketIoTask } = require("./tasks/print-completion.socketio.task");
const { PrintCompletionService } = require("./services/print-completion.service");
const { SocketIoGateway } = require("./state/socket-io.gateway");
const { ClientBundleService } = require("./services/client-bundle.service");
const FloorService = require("./services/floor.service");
const FloorStore = require("./state/floor.store");
const { YamlService } = require("./services/yaml.service");
const { MonsterPiService } = require("./services/monsterpi.service");
const { BatchCallService } = require("./services/batch-call.service");
const { ClientDistDownloadTask } = require("./tasks/client-bundle.task");
const { OctoPrintSockIoAdapter } = require("./services/octoprint/octoprint-sockio.adapter");
const { PrinterCache } = require("./state/printer.cache");
const PrinterSocketStore = require("./state/printer-socket.store");
const { TestPrinterSocketStore } = require("./state/test-printer-socket.store");
const { PrinterEventsCache } = require("./state/printer-events.cache");
const { LogDumpService } = require("./services/logs-manager.service");
const { CameraStreamService } = require("./services/camera-stream.service");
const { JwtService } = require("./services/authentication/jwt.service");
const { AuthService } = require("./services/authentication/auth.service");

function configureContainer() {
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
    [DITokens.octokitService]: asFunction((cradle) => {
      const config = cradle.configService;
      // cradle.
      return new Octokit({
        auth: config.get(AppConstants.GITHUB_PAT),
      });
    }),
    [DITokens.clientBundleService]: asClass(ClientBundleService),
    [DITokens.logDumpService]: asClass(LogDumpService),
    [DITokens.simpleGitService]: asValue(SimpleGitFactory()),
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
    [DITokens.customGCodeService]: asClass(CustomGCodeService),
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

module.exports = {
  configureContainer,
};
