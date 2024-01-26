import { PrinterSocketStore } from "@/state/printer-socket.store";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { SettingsStore } from "@/state/settings.store";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";

export class PrinterWebsocketTask {
  printerSocketStore: PrinterSocketStore;
  settingsStore: SettingsStore;
  octoPrintApiService: OctoPrintApiService;
  taskManagerService: TaskManagerService;

  logger: LoggerService;

  constructor({
    printerSocketStore,
    octoPrintApiService,
    settingsStore,
    taskManagerService,
    loggerFactory,
  }: {
    printerSocketStore: PrinterSocketStore;
    octoPrintApiService: OctoPrintApiService;
    settingsStore: SettingsStore;
    taskManagerService: TaskManagerService;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerSocketStore = printerSocketStore;
    this.settingsStore = settingsStore;
    this.octoPrintApiService = octoPrintApiService;
    this.taskManagerService = taskManagerService;
    this.logger = loggerFactory(PrinterWebsocketTask.name);
  }

  async run() {
    const startTime = Date.now();
    const result = await this.printerSocketStore.reconnectPrinterSockets();
    if (this.settingsStore.getDebugSettingsSensitive()?.debugSocketReconnect) {
      this.logger.log(`Socket reconnect (${Date.now() - startTime}ms)`, result);
    }
  }
}
