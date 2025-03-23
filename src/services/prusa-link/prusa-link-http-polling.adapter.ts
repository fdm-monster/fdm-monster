import { PrusaLinkType } from "@/services/printer-api.interface";
import { PrusaLinkApi } from "@/services/prusa-link/prusa-link.api";
import { IdType } from "@/shared.constants";
import { LoggerService } from "@/handlers/logger";
import EventEmitter2 from "eventemitter2";
import { ConfigService } from "@/services/core/config.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { ISocketLogin } from "@/shared/dtos/socket-login.dto";

export class PrusaLinkHttpPollingAdapter implements IWebsocketAdapter {
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

  socketState: "unopened" | "opening" | "authenticating" | "opened" | "authenticated" | "aborted" | "error" | "closed";
  apiState: "unset" | "noResponse" | "globalKey" | "authFail" | "responding";
  needsReopen(): boolean {
    throw new Error("Method not implemented.");
  }
  needsSetup(): boolean {
    throw new Error("Method not implemented.");
  }
  needsReauth(): boolean {
    throw new Error("Method not implemented.");
  }
  reauthSession(): void {
    throw new Error("Method not implemented.");
  }
  registerCredentials(socketLogin: ISocketLogin): void {
    this.socketURL = new URL(socketLogin.loginDto.printerURL);
    this.printerId = socketLogin.printerId;
  }
  open(): void {
    throw new Error("Method not implemented.");
  }
  close(): void {
    throw new Error("Method not implemented.");
  }
  setupSocketSession(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  resetSocketState(): void {
    // throw new Error("Method not implemented.");
  }
  allowEmittingEvents(): void {
    throw new Error("Method not implemented.");
  }
  disallowEmittingEvents(): void {
    throw new Error("Method not implemented.");
  }

  startPolling() {
    this.stopPolling(); // Ensure no duplicate intervals exist

    this.refreshPrinterCurrentInterval = setInterval(async () => {
      if (!this.printerId) {
        this.logger.warn("Printer ID is not set, skipping status check.");
        return;
      }

      try {
        await this.prusaLinkApi.updateAuthHeader();
        const status = await this.prusaLinkApi.getVersion();
        // this.eventEmitter.emit("prusaLinkStatus", status);
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
