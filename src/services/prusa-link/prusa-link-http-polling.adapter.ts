import { PrusaLinkType } from "@/services/printer-api.interface";
import { PrusaLinkApi } from "@/services/prusa-link/prusa-link.api";
import { IdType } from "@/shared.constants";
import { LoggerService } from "@/handlers/logger";
import EventEmitter2 from "eventemitter2";
import { ConfigService } from "@/services/core/config.service";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class PrusaLinkHttpPollingAdapter {
  public readonly printerType = PrusaLinkType;
  prusaLinkApi: PrusaLinkApi;
  public printerId?: IdType;
  protected declare logger: LoggerService;
  private eventEmitter: EventEmitter2;
  private configService: ConfigService;
  private socketURL?: URL;
  private refreshPrinterCurrentInterval?: NodeJS.Timeout;

  constructor({
    loggerFactory,
    prusaLinkApi,
    eventEmitter2,
    configService,
  }: {
    loggerFactory: ILoggerFactory;
    prusaLinkApi: PrusaLinkApi;
    eventEmitter2: EventEmitter2;
    configService: ConfigService;
  }) {
    this.logger = loggerFactory(PrusaLinkHttpPollingAdapter.name);
    this.prusaLinkApi = prusaLinkApi;
    this.eventEmitter = eventEmitter2;
    this.configService = configService;
  }

  startPolling() {
    this.stopPolling(); // Ensure no duplicate intervals exist

    this.refreshPrinterCurrentInterval = setInterval(async () => {
      if (!this.printerId) {
        this.logger.warn("Printer ID is not set, skipping status check.");
        return;
      }

      try {
        const status = await this.prusaLinkApi.getStatus(this.printerId);
        this.eventEmitter.emit("prusaLinkStatus", status);
      } catch (error) {
        this.logger.error("Failed to fetch PrusaLink status", error);
      }
    }, 10000);
  }

  stopPolling() {
    if (this.refreshPrinterCurrentInterval) {
      clearInterval(this.refreshPrinterCurrentInterval);
      this.refreshPrinterCurrentInterval = undefined;
    }
  }
}
