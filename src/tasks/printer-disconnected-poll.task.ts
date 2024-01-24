import { SettingsStore } from "@/state/settings.store";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class PrinterDisconnectedPollTask {
  settingsStore: SettingsStore;
  octoPrintApiService: OctoPrintApiService;
  taskManagerService: TaskManagerService;
  logger: LoggerService;

  constructor({
    octoPrintApiService,
    settingsStore,
    taskManagerService,
    loggerFactory,
  }: {
    octoPrintApiService: OctoPrintApiService;
    settingsStore: SettingsStore;
    taskManagerService: TaskManagerService;
    loggerFactory: ILoggerFactory;
  }) {
    this.settingsStore = settingsStore;
    this.octoPrintApiService = octoPrintApiService;
    this.taskManagerService = taskManagerService;
    this.logger = loggerFactory(PrinterDisconnectedPollTask.name);
  }

  async run() {
    const startTime = Date.now();
    this.logger.log("Refreshing disconnected printer states");
    // if (this.settingsStore.getSettingsSensitive().server.debugSettings?.debugSocketRetries) {
    //   this.logger.log(`Socket reconnect (${Date.now() - startTime}ms)`);
    // }
  }
}
