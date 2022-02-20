import axios from "axios";
import awilix, {asClass, asFunction, asValue, createContainer, InjectionMode} from "awilix";
import toadScheduler, {ToadScheduler} from "toad-scheduler";
import DITokens from "./container.tokens";
import PrinterService from "./services/printer.service";
import PrinterGroupService from "./services/printer-group.service";
import PrintersStore from "./state/printers.store";
import SettingsStore from "./state/settings.store";
import ServerSettingsService from "./services/server-settings.service";
import ClientSettingsService from "./services/client-settings.service";
import ServerUpdateService from "./services/server-update.service";
import InfluxDbSetupService from "./services/influx/influx-db-setup.service";
import ScriptService from "./services/script.service";
import TaskManagerService from "./services/task-manager.service";
import SystemInfoStore from "./state/system-info.store";
import SystemCommandsService from "./services/system-commands.service";
import SystemInfoBundleService from "./services/system-info-bundle.service";
import GithubApiService from "./services/github-api.service";
import HistoryService from "./services/history.service";
import FileCache from "./state/data/file.cache";
import HistoryStore from "./state/history.store";
import JobsCache from "./state/data/jobs.cache";
import UserTokenService from "./services/authentication/user-token.service";
import ServerSentEventsHandler from "./handlers/sse.handler";
import {OctoPrintLogsCache} from "./state/data/octoprint-logs.cache";
import PrinterWebsocketTask from "./tasks/printer-websocket.task";
import PrinterSseTask from "./tasks/printer-sse.task";
import PrinterSystemTask from "./tasks/printer-system.task";
import OctoPrintApiService from "./services/octoprint/octoprint-api.service";
import FilamentCache from "./state/data/filament.cache";
import PrinterState from "./state/printer.state";
import PrinterStateFactory from "./state/printer-state.factory";
import FilesStore from "./state/files.store";
import FilamentStore from "./state/filament.store";
import InfluxDbHistoryService from "./services/influx/influx-db-history.service";
import InfluxDbFilamentService from "./services/influx/influx-db-filament.service";
import InfluxDbPrinterStateService from "./services/influx/influx-db-printer-state.service";
import eventEmitter, {configureEventEmitter} from "./handlers/event-emitter";
import {AppConstants} from "./server.constants";
import PrinterFilesService from "./services/printer-files.service";
import SoftwareUpdateTask from "./tasks/software-update.task";
import AutoDiscoveryService from "./services/auto-discovery.service";
import TerminalLogsCache from "./state/data/terminal-logs.cache";
import DashboardStatisticsCache from "./state/data/dashboard-statistics.cache";
import AlertService from "./services/alert.service";
import LoggerFactory from "./handlers/logger-factory";
import PrinterTestTask from "./tasks/printer-test.task";
import PrinterGroupsCache from "./state/data/printer-groups.cache";
import MulterService from "./services/multer.service";
import FileUploadTrackerCache from "./state/data/file-upload-tracker.cache";
import ServerHost from "./server.host";
import BootTask from "./tasks/boot.task";
import PrinterProfilesCache from "./state/data/printer-profiles.cache";
import UserService from "./services/authentication/user.service";
import RoleService from "./services/authentication/role.service";
import tasks, {ServerTasks} from "./tasks";
import PermissionService from "./services/authentication/permission.service";
import authorization, {ROLES} from "./constants/authorization.constants";
import CustomGCodeService from "./services/custom-gcode.service";
import PrinterWebsocketPingTask from "./tasks/printer-websocket-ping.task";

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
