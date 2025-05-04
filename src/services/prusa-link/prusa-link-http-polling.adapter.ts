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
import { prusaLinkEvent } from "@/services/prusa-link/constants/prusalink.constants";
import { PrusaLinkEventDto } from "@/services/prusa-link/constants/prusalink-event.dto";

const defaultLog = { adapter: "prusa-link" };

export class PrusaLinkHttpPollingAdapter implements IWebsocketAdapter {
  public readonly printerType = PrusaLinkType;
  public printerId?: IdType;
  login: LoginDto;
  socketState: SocketState;
  apiState: ApiState;
  lastMessageReceivedTimestamp: null | number;
  protected declare logger: LoggerService;
  private refreshPrinterCurrentInterval?: NodeJS.Timeout;

  private eventEmittingAllowed: boolean = true;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly prusaLinkApi: PrusaLinkApi,
    private readonly eventEmitter2: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.logger = loggerFactory(PrusaLinkHttpPollingAdapter.name);
  }

  public allowEmittingEvents() {
    this.eventEmittingAllowed = true;
  }

  public disallowEmittingEvents() {
    this.eventEmittingAllowed = false;
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
    this.login = socketLogin.loginDto;
    this.printerId = socketLogin.printerId;
  }

  open(): void {
    this.startPolling();
  }

  close(): void {
    this.stopPolling();
  }

  setupSocketSession(): Promise<void> {
    this.logger.warn("SetupSocketSession", defaultLog);
    return Promise.resolve();
  }

  resetSocketState(): void {
    this.logger.warn("ResetSocketState", defaultLog);
  }

  startPolling() {
    this.stopPolling(); // Ensure no duplicate intervals exist

    this.refreshPrinterCurrentInterval = setInterval(async () => {
      if (!this.printerId) {
        this.logger.warn("Printer ID is not set, skipping status check.", this.logMeta());
        return;
      }
      const prusaLinkUsername = this.configService.get<string>("TEST_PL_USERNAME");
      const prusaLinkPassword = this.configService.get<string>("TEST_PL_PASSWORD");

      this.socketState = "opening";
      try {
        this.prusaLinkApi.login = {
          printerURL: this.login.printerURL,
          username: this.login.username ?? prusaLinkUsername,
          password: this.login.password ?? prusaLinkPassword,
          apiKey: "",
          printerType: PrusaLinkType,
        };
        this.socketState = "authenticating";
        const status = await this.prusaLinkApi.getPrinterState();
        this.socketState = "authenticated";
        this.apiState = "responding";
        await this.emitEvent("current", status);
      } catch (error) {
        this.socketState = "error";
        this.logger.error(`Failed to fetch PrusaLink status ${errorSummary(error)}`, this.logMeta());
      }
    }, 5000);
  }

  stopPolling() {
    if (this.refreshPrinterCurrentInterval) {
      clearInterval(this.refreshPrinterCurrentInterval);
      this.refreshPrinterCurrentInterval = undefined;
      this.socketState = "closed";
    }
  }

  private async emitEvent(event: string, payload?: any) {
    if (!this.eventEmittingAllowed) {
      return;
    }

    this.logger.debug(`Emitting event ${prusaLinkEvent(event)}`, this.logMeta());
    await this.eventEmitter2.emitAsync(prusaLinkEvent(event), {
      event,
      payload,
      printerId: this.printerId,
      printerType: PrusaLinkType,
    } as PrusaLinkEventDto);
  }

  private logMeta() {
    return defaultLog;
  }
}
