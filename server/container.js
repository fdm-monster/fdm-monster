const axios = require("axios");
const DITokens = require("./container.tokens");
const PrinterService = require("./services/printer.service");
const PrinterGroupService = require("./services/printer-group.service");
const PrintersStore = require("./state/printers.store");
const SettingsStore = require("./state/settings.store");
const ServerSettingsService = require("./services/server-settings.service");
const ClientSettingsService = require("./services/client-settings.service");
const ServerUpdateService = require("./services/server-update.service");
const InfluxDbSetupService = require("./services/influx/influx-db-setup.service");
const ScriptService = require("./services/script.service");
const TaskManagerService = require("./services/task-manager.service");
const SystemInfoStore = require("./state/system-info.store");
const SystemCommandsService = require("./services/system-commands.service");
const ServerLogsService = require("./services/server-logs.service");
const SystemInfoBundleService = require("./services/system-info-bundle.service");
const GithubApiService = require("./services/github-api.service");
const HistoryService = require("./services/history.service");
const FileCache = require("./state/data/file.cache");
const HistoryCache = require("./state/data/history.cache");
const JobsCache = require("./state/data/jobs.cache");
const UserTokenService = require("./services/authentication/user-token.service");
const ServerSentEventsHandler = require("./handlers/sse.handler");
const PrinterFilesTask = require("./tasks/printer-files.task");
const PrinterTickerStore = require("./state/printer-ticker.store");
const PrinterWebsocketTask = require("./tasks/printer-websocket.task");
const PrinterSseTask = require("./tasks/printer-sse.task");
const CurrentOperationsCache = require("./state/data/current-operations.cache");
const PrinterSystemTask = require("./tasks/printer-system.task");
const OctoPrintApiService = require("./services/octoprint/octoprint-api.service");
const FilamentCache = require("./state/data/filament.cache");
const PrinterState = require("./state/printer.state");
const PrinterStateFactory = require("./state/printer-state.factory");
const FilesStore = require("./state/files.store");
const FilamentStore = require("./state/filament.store");
const InfluxDbHistoryService = require("./services/influx/influx-db-history.service");
const InfluxDbFilamentService = require("./services/influx/influx-db-filament.service");
const InfluxDbPrinterStateService = require("./services/influx/influx-db-printer-state.service");
const { configureEventEmitter } = require("./handlers/event-emitter");
const { AppConstants } = require("./server.constants");
const PrinterFilesService = require("./services/printer-files.service");
const SoftwareUpdateTask = require("./tasks/software-update.task");
const AutoDiscoveryService = require("./services/auto-discovery.service");
const ConnectionLogsCache = require("./state/data/connection-logs.cache");
const DashboardStatisticsCache = require("./state/data/dashboard-statistics.cache");
const AlertService = require("./services/alert.service");
const { asFunction, asClass, asValue, createContainer, InjectionMode } = require("awilix");
const LoggerFactory = require("./handlers/logger-factory");
const PrinterTestTask = require("./tasks/printer-test.task");
const PrinterGroupsCache = require("./state/data/printer-groups.cache");
const MulterService = require("./services/multer.service");
const FileUploadTrackerCache = require("./state/data/file-upload-tracker.cache");
const ServerHost = require("./server.host");
const BootTask = require("./tasks/boot.task");
const PrinterProfilesCache = require("./state/data/printer-profiles.cache");

function configureContainer() {
  // Create the container and set the injectionMode to PROXY (which is also the default).
  const container = createContainer({
    injectionMode: InjectionMode.PROXY
  });

  container.register({
    // -- asValue --
    serverVersion: asValue(
      process.env[AppConstants.VERSION_KEY] || AppConstants.defaultServerPageTitle
    ),
    serverPageTitle: asValue(process.env[AppConstants.SERVER_SITE_TITLE_KEY]),

    // -- asFunction --
    [DITokens.printerStateFactory]: asFunction(PrinterStateFactory).transient(), // Factory function, transient on purpose!

    // -- asClass --
    [DITokens.serverHost]: asClass(ServerHost).singleton(),
    [DITokens.settingsStore]: asClass(SettingsStore).singleton(),
    [DITokens.serverSettingsService]: asClass(ServerSettingsService),
    [DITokens.clientSettingsService]: asClass(ClientSettingsService),
    [DITokens.userTokenService]: asClass(UserTokenService).singleton(),

    [DITokens.loggerFactory]: asFunction(LoggerFactory).transient(),
    [DITokens.taskManagerService]: asClass(TaskManagerService).singleton(),
    [DITokens.eventEmitter2]: asFunction(configureEventEmitter).singleton(),
    [DITokens.serverUpdateService]: asClass(ServerUpdateService).singleton(),
    [DITokens.systemInfoStore]: asClass(SystemInfoStore).singleton(),
    [DITokens.githubApiService]: asClass(GithubApiService),
    [DITokens.autoDiscoveryService]: asClass(AutoDiscoveryService),
    [DITokens.systemCommandsService]: asClass(SystemCommandsService),
    [DITokens.serverLogsService]: asClass(ServerLogsService),
    [DITokens.systemInfoBundleService]: asClass(SystemInfoBundleService),
    [DITokens.httpClient]: asValue(
      axios.create({
        maxBodyLength: 1000 * 1000 * 1000, // 1GB
        maxContentLength: 1000 * 1000 * 1000 // 1GB
      })
    ),
    [DITokens.multerService]: asClass(MulterService).singleton(),
    [DITokens.printerService]: asClass(PrinterService),
    [DITokens.printerFilesService]: asClass(PrinterFilesService),
    [DITokens.printerGroupService]: asClass(PrinterGroupService),
    [DITokens.octoPrintApiService]: asClass(OctoPrintApiService).singleton(),
    [DITokens.historyService]: asClass(HistoryService),
    [DITokens.dashboardStatisticsCache]: asClass(DashboardStatisticsCache),

    [DITokens.filamentCache]: asClass(FilamentCache).singleton(),
    [DITokens.printerProfilesCache]: asClass(PrinterProfilesCache).singleton(),
    [DITokens.currentOperationsCache]: asClass(CurrentOperationsCache).singleton(),
    [DITokens.printerState]: asClass(PrinterState).transient(), // Transient on purpose!
    [DITokens.printerGroupsCache]: asClass(PrinterGroupsCache).singleton(),
    [DITokens.historyCache]: asClass(HistoryCache).singleton(),
    [DITokens.jobsCache]: asClass(JobsCache).singleton(),
    [DITokens.connectionLogsCache]: asClass(ConnectionLogsCache).singleton(),
    [DITokens.printerTickerStore]: asClass(PrinterTickerStore).singleton(),
    [DITokens.fileCache]: asClass(FileCache).singleton(),
    [DITokens.fileUploadTrackerCache]: asClass(FileUploadTrackerCache).singleton(),
    [DITokens.filamentStore]: asClass(FilamentStore), // No need for singleton as its now based on filamentCache
    [DITokens.filesStore]: asClass(FilesStore).singleton(),
    [DITokens.printersStore]: asClass(PrintersStore).singleton(),

    // Extensibility and export
    [DITokens.alertService]: asClass(AlertService),
    [DITokens.scriptService]: asClass(ScriptService),
    [DITokens.influxDbSetupService]: asClass(InfluxDbSetupService).singleton(),
    [DITokens.influxDbFilamentService]: asClass(InfluxDbFilamentService),
    [DITokens.influxDbHistoryService]: asClass(InfluxDbHistoryService),
    [DITokens.influxDbPrinterStateService]: asClass(InfluxDbPrinterStateService),

    [DITokens.bootTask]: asClass(BootTask),
    [DITokens.softwareUpdateTask]: asClass(SoftwareUpdateTask),
    // Provided SSE handlers (couplers) shared with controllers
    [DITokens.printerSseHandler]: asClass(ServerSentEventsHandler).singleton(),
    // Task bound to send on SSE Handler
    [DITokens.printerSseTask]: asClass(PrinterSseTask).singleton(),
    // Normal post-analysis operations (previously called cleaners)
    [DITokens.printerFilesTask]: asClass(PrinterFilesTask).singleton(),
    // This task is a quick task (~100ms per printer)
    [DITokens.printerWebsocketTask]: asClass(PrinterWebsocketTask).singleton(),
    // Task dependent on WS to fire - disabled at boot
    [DITokens.printerSystemTask]: asClass(PrinterSystemTask).singleton(),
    // Task dependent on test printer in store - disabled at boot
    [DITokens.printerTestTask]: asClass(PrinterTestTask).singleton()
  });

  return container;
}

module.exports = {
  configureContainer
};
