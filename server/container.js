const axios = require("axios");
const { asFunction, asClass, asValue, createContainer, InjectionMode } = require("awilix");
const { ToadScheduler } = require("toad-scheduler");
const DITokens = require("./container.tokens");
const SimpleGitFactory = require("simple-git");
const { Octokit } = require("octokit");
const PrinterService = require("./services/printer.service");
const SettingsStore = require("./state/settings.store");
const ServerSettingsService = require("./services/server-settings.service");
const ServerReleaseService = require("./services/server-release.service");
const TaskManagerService = require("./services/task-manager.service");
const ServerUpdateService = require("./services/server-update.service");
const GithubApiService = require("./services/github-api.service");
const FileCache = require("./state/file.cache");
const JobsCache = require("./state/jobs.cache");
const PrinterWebsocketTask = require("./tasks/printer-websocket.task");
const PrinterSocketIoTask = require("./tasks/printer-socketio.task");
const PrinterSystemTask = require("./tasks/printer-system.task");
const OctoPrintApiService = require("./services/octoprint/octoprint-api.service");
const PrinterState = require("./state/printer.state");
const PrinterStateFactory = require("./state/printer-state.factory");
const FilesStore = require("./state/files.store");
const { configureEventEmitter } = require("./handlers/event-emitter");
const { AppConstants } = require("./server.constants");
const PrinterFilesService = require("./services/printer-files.service");
const SoftwareUpdateTask = require("./tasks/software-update.task");
const LoggerFactory = require("./handlers/logger-factory");
const PrinterTestTask = require("./tasks/printer-test.task");
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
const PrinterWebsocketPingTask = require("./tasks/printer-websocket-ping.task");
const { PluginFirmwareUpdateService } = require("./services/octoprint/plugin-firmware-update.service");
const { PluginRepositoryCache } = require("./services/octoprint/plugin-repository.cache");
const { configureCacheManager } = require("./handlers/cache-manager");
const { PluginFirmwareUpdatePreparationTask } = require("./tasks/plugin-firmware-download.task");
const { InfluxDbV2BaseService } = require("./services/influxdb-v2/influx-db-v2-base.service");
const { ConfigService } = require("./services/config.service");
const { PrintCompletionSocketIoTask } = require("./tasks/print-completion.socketio.task");
const { PrintCompletionService } = require("./services/print-completion.service");
const { SocketIoGateway } = require("./state/socket-io.gateway");
const { ClientBundleService } = require("./services/client-bundle.service");
const FloorService = require("./services/floor.service");
const FloorStore = require("./state/floor.store");
const PrinterStore = require("./state/printer.store");
const { YamlService } = require("./services/yaml.service");
const { MonsterPiService } = require("./services/monsterpi.service");
const { BatchCallService } = require("./services/batch-call.service");

function configureContainer() {
  // Create the container and set the injectionMode to PROXY (which is also the default).
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  container.register({
    // -- asValue/asFunction constants --
    [DITokens.serverTasks]: asValue(ServerTasks),
    [DITokens.defaultRole]: asValue(ROLES.ADMIN), // -- asFunction --
    [DITokens.serverVersion]: asFunction(() => {
      return process.env[AppConstants.VERSION_KEY];
    }),
    [DITokens.printerStateFactory]: asFunction(PrinterStateFactory).transient(), // Factory function, transient on purpose!

    // -- asClass --
    [DITokens.serverHost]: asClass(ServerHost).singleton(),
    [DITokens.settingsStore]: asClass(SettingsStore).singleton(),
    [DITokens.serverSettingsService]: asClass(ServerSettingsService),
    [DITokens.configService]: asClass(ConfigService),
    [DITokens.userService]: asClass(UserService),
    [DITokens.roleService]: asClass(RoleService).singleton(), // caches roles
    [DITokens.permissionService]: asClass(PermissionService).singleton(),

    [DITokens.loggerFactory]: asFunction(LoggerFactory).transient(),
    [DITokens.taskManagerService]: asClass(TaskManagerService).singleton(),
    [DITokens.toadScheduler]: asClass(ToadScheduler).singleton(),
    [DITokens.eventEmitter2]: asFunction(configureEventEmitter).singleton(),
    [DITokens.cacheManager]: asFunction(configureCacheManager).singleton(),
    [DITokens.serverReleaseService]: asClass(ServerReleaseService).singleton(),
    [DITokens.monsterPiService]: asClass(MonsterPiService).singleton(),
    [DITokens.serverUpdateService]: asClass(ServerUpdateService).singleton(),
    [DITokens.githubApiService]: asClass(GithubApiService),
    [DITokens.octokitService]: asFunction((cradle) => {
      const config = cradle.configService;
      // cradle.
      return new Octokit({
        auth: config.get(AppConstants.GITHUB_PAT),
        request: {
          fetch: require("node-fetch"),
        },
      });
    }),
    [DITokens.clientBundleService]: asClass(ClientBundleService),
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
    [DITokens.batchCallService]: asClass(BatchCallService).singleton(),
    [DITokens.pluginFirmwareUpdateService]: asClass(PluginFirmwareUpdateService).singleton(),

    [DITokens.printerState]: asClass(PrinterState).transient(), // Transient on purpose!
    [DITokens.floorStore]: asClass(FloorStore).singleton(),
    [DITokens.jobsCache]: asClass(JobsCache).singleton(),
    [DITokens.pluginRepositoryCache]: asClass(PluginRepositoryCache).singleton(),
    [DITokens.fileCache]: asClass(FileCache).singleton(),
    [DITokens.fileUploadTrackerCache]: asClass(FileUploadTrackerCache).singleton(),
    [DITokens.filesStore]: asClass(FilesStore).singleton(),
    [DITokens.printerStore]: asClass(PrinterStore).singleton(),

    // Extensibility and export
    [DITokens.customGCodeService]: asClass(CustomGCodeService),
    [DITokens.influxDbV2BaseService]: asClass(InfluxDbV2BaseService),

    [DITokens.bootTask]: asClass(BootTask),
    [DITokens.softwareUpdateTask]: asClass(SoftwareUpdateTask), // Provided SSE handlers (couplers) shared with controllers
    [DITokens.printerSocketIoTask]: asClass(PrinterSocketIoTask).singleton(), // This task is a quick task (~100ms per printer)
    [DITokens.printCompletionSocketIoTask]: asClass(PrintCompletionSocketIoTask).singleton(),
    [DITokens.printerWebsocketTask]: asClass(PrinterWebsocketTask).singleton(), // This task is a recurring heartbeat task
    [DITokens.printerWebsocketPingTask]: asClass(PrinterWebsocketPingTask).singleton(), // Task dependent on WS to fire - disabled at boot
    [DITokens.printerSystemTask]: asClass(PrinterSystemTask).singleton(), // Task dependent on test printer in store - disabled at boot
    [DITokens.printerTestTask]: asClass(PrinterTestTask).singleton(), // Task to regularly clean printer files based on certain configuration settings
    [DITokens.printerFileCleanTask]: asClass(PrinterFileCleanTask).singleton(),
    [DITokens.pluginFirmwareUpdatePreparationTask]: asClass(PluginFirmwareUpdatePreparationTask).singleton(), // Delayed run-once cache loader and firmware download utility
  });

  return container;
}

module.exports = {
  configureContainer,
};
