import { PrinterSocketStore } from "@/state/printer-socket.store";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";

export class PrinterWebsocketTask {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerSocketStore: PrinterSocketStore,
    private readonly settingsStore: SettingsStore
  ) {
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
