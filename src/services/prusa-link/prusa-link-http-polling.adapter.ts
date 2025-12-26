import { PrusaLinkType } from "@/services/printer-api.interface";
import { PrusaLinkApi } from "@/services/prusa-link/prusa-link.api";
import { LoggerService } from "@/handlers/logger";
import EventEmitter2 from "eventemitter2";
import { ConfigService } from "@/services/core/config.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { ISocketLogin } from "@/shared/dtos/socket-login.dto";
import { LoginDto } from "@/services/interfaces/login.dto";
import { SOCKET_STATE, SocketState } from "@/shared/dtos/socket-state.type";
import { API_STATE, ApiState } from "@/shared/dtos/api-state.type";
import { errorSummary } from "@/utils/error.utils";
import { prusaLinkEvent } from "@/services/prusa-link/constants/prusalink.constants";
import { PrusaLinkEventDto } from "@/services/prusa-link/constants/prusalink-event.dto";
import { WsMessage } from "@/services/octoprint/octoprint-websocket.adapter";

const defaultLog = { adapter: "prusa-link" };

export class PrusaLinkHttpPollingAdapter implements IWebsocketAdapter {
  public readonly printerType = PrusaLinkType;
  public printerId?: number;
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
    this.logger.debug("Polling adapter attempting stoppage.", this.logMeta());
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

    this.logger.debug("Polling adapter starting, setting interval.", this.logMeta());

    this.refreshPrinterCurrentInterval = setInterval(async () => {
      if (!this.printerId) {
        this.logger.warn("Printer ID is not set, skipping status check.", this.logMeta());
        this.stopPolling();
        return;
      }

      this.updateSocketState(SOCKET_STATE.opening);
      try {
        this.prusaLinkApi.login = {
          printerURL: this.login.printerURL,
          username: this.login.username,
          password: this.login.password,
          apiKey: "",
          printerType: PrusaLinkType,
        };
        this.updateSocketState(SOCKET_STATE.authenticating);
        const printerState = await this.prusaLinkApi.getPrinterState();
        // Only when PRINTING we avoid appending the flag
        if (printerState.state.flags?.link_state && printerState.state.flags?.link_state !== "PRINTING") {
          printerState.state.text = printerState.state.flags.link_state;
        }
        const jobState = await this.prusaLinkApi.getJobState();
        this.updateSocketState(SOCKET_STATE.authenticated);
        this.updateApiState(API_STATE.responding);
        await this.emitEvent("current", {
          ...printerState,
          job: jobState.job,
          progress: {
            printTime: jobState.progress?.printTime,
            printTimeLeft: jobState.progress?.printTimeLeft,
            completion: jobState.progress?.completion * 100,
          },
        });
      } catch (error) {
        this.updateSocketState(SOCKET_STATE.error);
        this.logger.error(`Failed to fetch PrusaLink status ${errorSummary(error)}`, this.logMeta());
      }
    }, 5000);
  }

  stopPolling() {
    if (this.refreshPrinterCurrentInterval) {
      this.logger.debug("Polling adapter stopping, clearing interval.", this.logMeta());
      clearInterval(this.refreshPrinterCurrentInterval);
      this.refreshPrinterCurrentInterval = undefined;
      this.updateSocketState(SOCKET_STATE.closed);
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

  private emitEventSync(event: string, payload: any): void {
    if (!this.eventEmittingAllowed) {
      return;
    }

    this.eventEmitter2.emit(prusaLinkEvent(event), {
      event,
      payload,
      printerId: this.printerId,
      printerType: PrusaLinkType,
    } as PrusaLinkEventDto);
  }

  private updateSocketState(state: SocketState): void {
    this.socketState = state;
    this.emitEventSync(WsMessage.WS_STATE_UPDATED, state);
  }

  private updateApiState(state: ApiState): void {
    this.apiState = state;
    this.emitEventSync(WsMessage.API_STATE_UPDATED, state);
  }

  private logMeta() {
    return defaultLog;
  }
}
