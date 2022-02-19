import axios from "axios";
import awilix from "awilix";
import toadScheduler from "toad-scheduler";
import DITokens from "./container.tokens.js";
import PrinterService from "./services/printer.service.js";
import PrinterGroupService from "./services/printer-group.service.js";
import PrintersStore from "./state/printers.store.js";
import SettingsStore from "./state/settings.store.js";
import ServerSettingsService from "./services/server-settings.service.js";
import ClientSettingsService from "./services/client-settings.service.js";
import ServerUpdateService from "./services/server-update.service.js";
import InfluxDbSetupService from "./services/influx/influx-db-setup.service.js";
import ScriptService from "./services/script.service.js";
import TaskManagerService from "./services/task-manager.service.js";
import SystemInfoStore from "./state/system-info.store.js";
import SystemCommandsService from "./services/system-commands.service.js";
import SystemInfoBundleService from "./services/system-info-bundle.service.js";
import GithubApiService from "./services/github-api.service.js";
import HistoryService from "./services/history.service.js";
import FileCache from "./state/data/file.cache.js";
import HistoryStore from "./state/history.store.js";
import JobsCache from "./state/data/jobs.cache.js";
import UserTokenService from "./services/authentication/user-token.service.js";
import ServerSentEventsHandler from "./handlers/sse.handler.js";
import OctoPrintLogsCache from "./state/data/octoprint-logs.cache.js";
import PrinterWebsocketTask from "./tasks/printer-websocket.task.js";
import PrinterSseTask from "./tasks/printer-sse.task.js";
import PrinterSystemTask from "./tasks/printer-system.task.js";
import OctoPrintApiService from "./services/octoprint/octoprint-api.service.js";
import FilamentCache from "./state/data/filament.cache.js";
import PrinterState from "./state/printer.state.js";
import PrinterStateFactory from "./state/printer-state.factory.js";
import FilesStore from "./state/files.store.js";
import FilamentStore from "./state/filament.store.js";
import InfluxDbHistoryService from "./services/influx/influx-db-history.service.js";
import InfluxDbFilamentService from "./services/influx/influx-db-filament.service.js";
import InfluxDbPrinterStateService from "./services/influx/influx-db-printer-state.service.js";
import eventEmitter from "./handlers/event-emitter.js";
import { AppConstants } from "./server.constants.js";
import PrinterFilesService from "./services/printer-files.service.js";
import SoftwareUpdateTask from "./tasks/software-update.task.js";
import AutoDiscoveryService from "./services/auto-discovery.service.js";
import TerminalLogsCache from "./state/data/terminal-logs.cache.js";
import DashboardStatisticsCache from "./state/data/dashboard-statistics.cache.js";
import AlertService from "./services/alert.service.js";
import LoggerFactory from "./handlers/logger-factory.js";
import PrinterTestTask from "./tasks/printer-test.task.js";
import PrinterGroupsCache from "./state/data/printer-groups.cache.js";
import MulterService from "./services/multer.service.js";
import FileUploadTrackerCache from "./state/data/file-upload-tracker.cache.js";
import ServerHost from "./server.host.js";
import BootTask from "./tasks/boot.task.js";
import PrinterProfilesCache from "./state/data/printer-profiles.cache.js";
import UserService from "./services/authentication/user.service.js";
import RoleService from "./services/authentication/role.service.js";
import tasks from "./tasks.js";
import PermissionService from "./services/authentication/permission.service.js";
import authorization from "./constants/authorization.constants.js";
import CustomGCodeService from "./services/custom-gcode.service.js";
import PrinterWebsocketPingTask from "./tasks/printer-websocket-ping.task.js";
const { configureEventEmitter } = eventEmitter;
const { asFunction, asClass, asValue, createContainer, InjectionMode } = awilix;
const { ToadScheduler } = toadScheduler;
const { ServerTasks } = tasks;
const { ROLES } = authorization;
function configureContainer() {
    // Create the container and set the injectionMode to PROXY (which is also the default).
    const container = createContainer({
        injectionMode: InjectionMode.PROXY
    });
    container.register({
        // -- asValue --
        serverVersion: asValue(process.env[AppConstants.VERSION_KEY] || AppConstants.defaultServerPageTitle),
        serverPageTitle: asValue(process.env[AppConstants.SERVER_SITE_TITLE_KEY]),
        [DITokens.serverTasks]: asValue(ServerTasks),
        [DITokens.defaultRole]: asValue(ROLES.ADMIN),
        // -- asFunction --
        [DITokens.printerStateFactory]: asFunction(PrinterStateFactory).transient(),
        // -- asClass --
        [DITokens.serverHost]: asClass(ServerHost).singleton(),
        [DITokens.settingsStore]: asClass(SettingsStore).singleton(),
        [DITokens.serverSettingsService]: asClass(ServerSettingsService),
        [DITokens.clientSettingsService]: asClass(ClientSettingsService),
        [DITokens.userTokenService]: asClass(UserTokenService).singleton(),
        [DITokens.userService]: asClass(UserService),
        [DITokens.roleService]: asClass(RoleService).singleton(),
        [DITokens.permissionService]: asClass(PermissionService).singleton(),
        [DITokens.loggerFactory]: asFunction(LoggerFactory).transient(),
        [DITokens.taskManagerService]: asClass(TaskManagerService).singleton(),
        [DITokens.toadScheduler]: asClass(ToadScheduler).singleton(),
        [DITokens.eventEmitter2]: asFunction(configureEventEmitter).singleton(),
        [DITokens.serverUpdateService]: asClass(ServerUpdateService).singleton(),
        [DITokens.systemInfoStore]: asClass(SystemInfoStore).singleton(),
        [DITokens.githubApiService]: asClass(GithubApiService),
        [DITokens.autoDiscoveryService]: asClass(AutoDiscoveryService),
        [DITokens.systemCommandsService]: asClass(SystemCommandsService),
        [DITokens.systemInfoBundleService]: asClass(SystemInfoBundleService),
        [DITokens.httpClient]: asValue(axios.create({
            maxBodyLength: 1000 * 1000 * 1000,
            maxContentLength: 1000 * 1000 * 1000 // 1GB
        })),
        [DITokens.multerService]: asClass(MulterService).singleton(),
        [DITokens.printerService]: asClass(PrinterService),
        [DITokens.printerFilesService]: asClass(PrinterFilesService),
        [DITokens.printerGroupService]: asClass(PrinterGroupService),
        [DITokens.octoPrintApiService]: asClass(OctoPrintApiService).singleton(),
        [DITokens.historyService]: asClass(HistoryService),
        [DITokens.dashboardStatisticsCache]: asClass(DashboardStatisticsCache),
        [DITokens.filamentCache]: asClass(FilamentCache).singleton(),
        [DITokens.printerProfilesCache]: asClass(PrinterProfilesCache).singleton(),
        [DITokens.printerState]: asClass(PrinterState).transient(),
        [DITokens.printerGroupsCache]: asClass(PrinterGroupsCache).singleton(),
        [DITokens.historyStore]: asClass(HistoryStore).singleton(),
        [DITokens.jobsCache]: asClass(JobsCache).singleton(),
        [DITokens.terminalLogsCache]: asClass(TerminalLogsCache).singleton(),
        [DITokens.octoPrintLogsCache]: asClass(OctoPrintLogsCache).singleton(),
        [DITokens.fileCache]: asClass(FileCache).singleton(),
        [DITokens.fileUploadTrackerCache]: asClass(FileUploadTrackerCache).singleton(),
        [DITokens.filamentStore]: asClass(FilamentStore),
        [DITokens.filesStore]: asClass(FilesStore).singleton(),
        [DITokens.printersStore]: asClass(PrintersStore).singleton(),
        // Extensibility and export
        [DITokens.alertService]: asClass(AlertService),
        [DITokens.scriptService]: asClass(ScriptService),
        [DITokens.customGCodeService]: asClass(CustomGCodeService),
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
        // This task is a quick task (~100ms per printer)
        [DITokens.printerWebsocketTask]: asClass(PrinterWebsocketTask).singleton(),
        // This task is a recurring heartbeat task
        [DITokens.printerWebsocketPingTask]: asClass(PrinterWebsocketPingTask).singleton(),
        // Task dependent on WS to fire - disabled at boot
        [DITokens.printerSystemTask]: asClass(PrinterSystemTask).singleton(),
        // Task dependent on test printer in store - disabled at boot
        [DITokens.printerTestTask]: asClass(PrinterTestTask).singleton()
    });
    return container;
}
export { configureContainer };
export default {
    configureContainer
};
