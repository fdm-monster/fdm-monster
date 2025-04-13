import { PrusaLinkType } from "@/services/printer-api.interface";
import { PrusaLinkApi } from "@/services/prusa-link/prusa-link.api";
import { IdType } from "@/shared.constants";
import { LoggerService } from "@/handlers/logger";
import EventEmitter2 from "eventemitter2";
import { ConfigService } from "@/services/core/config.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { ISocketLogin } from "@/shared/dtos/socket-login.dto";
import { LoginDto } from "@/services/interfaces/login.dto";
import { SocketState } from "@/shared/dtos/socket-state.type";
import { ApiState } from "@/shared/dtos/api-state.type";
import { errorSummary } from "@/utils/error.utils";

export class PrusaLinkHttpPollingAdapter implements IWebsocketAdapter {
  public readonly printerType = PrusaLinkType;
  public printerId?: IdType;
  login: LoginDto;
  socketState: SocketState;
  apiState: ApiState;
  lastMessageReceivedTimestamp: null | number;
  protected declare logger: LoggerService;
  private printerURL?: URL;
  private refreshPrinterCurrentInterval?: NodeJS.Timeout;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly prusaLinkApi: PrusaLinkApi,
    private readonly eventEmitter2: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.logger = loggerFactory(PrusaLinkHttpPollingAdapter.name);
  }

  needsReopen(): boolean {
    // TODO this can be standardized
    return !this.refreshPrinterCurrentInterval;
  }

  needsSetup(): boolean {
    // TODO this can be standardized
    return !this.refreshPrinterCurrentInterval;
  }

  needsReauth(): boolean {
    throw new Error("Method not implemented.");
  }

  isClosedOrAborted(): boolean {
    throw new Error("Method not implemented.");
  }

  reauthSession(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  registerCredentials(socketLogin: ISocketLogin): void {
    this.printerURL = new URL(socketLogin.loginDto.printerURL);
    this.printerId = socketLogin.printerId;
  }

  open(): void {
    this.startPolling();
  }

  close(): void {
    this.stopPolling();
  }

  setupSocketSession(): Promise<void> {
    this.logger.warn("SetupSocketSession");
    return Promise.resolve();
  }

  resetSocketState(): void {
    this.logger.warn("ResetSocketState");
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
      const prusaLinkUsername = this.configService.get<string>("TEST_PL_USERNAME");
      const prusaLinkPassword = this.configService.get<string>("TEST_PL_PASSWORD");

      try {
        this.prusaLinkApi.login = {
          printerURL: this.login.printerURL,
          username: this.login.username ?? prusaLinkUsername,
          password: this.login.password ?? prusaLinkPassword,
          apiKey: "",
          printerType: PrusaLinkType,
        };
        const status = await this.prusaLinkApi.getVersion();
        // this.eventEmitter.emit("prusaLinkStatus", status);
      } catch (error) {
        this.logger.error(`Failed to fetch PrusaLink status ${errorSummary(error)}`);
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
