import { HttpStatusCode } from "@/constants/http-status-codes.constants";
import { AppConstants } from "@/server.constants";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import { httpToWsUrl } from "@/utils/url.utils";
import { normalizeUrl } from "@/utils/normalize-url";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { ConfigService } from "@/services/core/config.service";
import { IdType } from "@/shared.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { AxiosError } from "axios";
import { ISocketLogin } from "@/shared/dtos/socket-login.dto";
import { WebsocketAdapter } from "@/shared/websocket.adapter";
import { OctoPrintEventDto } from "@/services/octoprint/dto/octoprint-event.dto";
import { LoginDto } from "@/services/interfaces/login.dto";
import { SOCKET_STATE, SocketState } from "@/shared/dtos/socket-state.type";
import { API_STATE, ApiState } from "@/shared/dtos/api-state.type";
import { OP_LoginDto } from "@/services/octoprint/dto/auth/login.dto";
import { Event as WsEvent } from "ws";
import { CurrentMessageDto } from "@/services/octoprint/dto/websocket/current-message.dto";
import { OctoprintErrorDto } from "@/services/octoprint/dto/rest/error.dto";
import { OctoprintType } from "@/services/printer-api.interface";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { CurrentJobDto } from "@/services/octoprint/dto/job/current-job.dto";

export const WsMessage = {
  // Custom events
  WS_OPENED: "WS_OPENED",
  WS_CLOSED: "WS_CLOSED",
  WS_ERROR: "WS_ERROR",
  API_STATE_UPDATED: "API_STATE_UPDATED",
  WS_STATE_UPDATED: "WS_STATE_UPDATED",
} as const;

export const OctoPrintMessage = {
  connected: "connected",
  reauthRequired: "reauthRequired",
  current: "current",
  history: "history",
  event: "event",
  plugin: "plugin",
  timelapse: "timelapse",
  slicingProgress: "slicingProgress",
} as const;

export const octoPrintWebsocketEvent = (printerId: string) => `octoprint.${printerId}`;
export const octoPrintEvent = (event: string) => `octoprint.${event}`;

export class OctoprintWebsocketAdapter extends WebsocketAdapter implements IWebsocketAdapter {
  public readonly printerType = 0;
  public printerId?: IdType;
  stateUpdated = false;
  stateUpdateTimestamp: null | number = null;
  socketState: SocketState = SOCKET_STATE.unopened;
  apiStateUpdated = false;
  apiStateUpdateTimestamp: null | number = null;
  apiState: ApiState = API_STATE.unset;
  lastMessageReceivedTimestamp: null | number = null;
  reauthRequired = false;
  reauthRequiredTimestamp: null | number = null;
  // Guaranteed to be set and valid by PrinterApiFactory
  login: LoginDto;
  protected declare logger: LoggerService;
  private socketURL?: URL;
  private sessionDto?: OP_LoginDto;
  private username?: string;
  private refreshPrinterCurrentInterval?: NodeJS.Timeout;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly octoprintClient: OctoprintClient,
    private readonly eventEmitter2: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    super(loggerFactory);

    this.logger = loggerFactory(OctoprintWebsocketAdapter.name);
  }

  get _debugMode() {
    return this.configService.get(AppConstants.debugSocketStatesKey, AppConstants.defaultDebugSocketStates) === "true";
  }

  needsReopen() {
    const isApiOnline = this.apiState === API_STATE.responding;
    return isApiOnline && (this.socketState === SOCKET_STATE.closed || this.socketState === SOCKET_STATE.error);
  }

  needsSetup() {
    return this.socketState === SOCKET_STATE.unopened;
  }

  needsReauth() {
    return this.reauthRequired;
  }

  isClosedOrAborted() {
    return this.socketState === SOCKET_STATE.closed || this.socketState === SOCKET_STATE.aborted;
  }

  registerCredentials(socketLogin: ISocketLogin) {
    const { printerId, loginDto } = socketLogin;
    this.printerId = printerId;
    this.login = loginDto;

    const httpUrlString = normalizeUrl(this.login.printerURL);
    const httpUrl = new URL(httpUrlString);
    const httpUrlPath = httpUrl.pathname;

    const wsUrl = httpToWsUrl(httpUrlString);
    wsUrl.pathname = (httpUrlPath ?? "/") + "sockjs/websocket";
    this.socketURL = wsUrl;
  }

  open() {
    if (this.socket) {
      throw new Error(`Socket already exists by printerId, ignoring open request`);
    }

    super.open(this.socketURL);
  }

  close() {
    clearInterval(this.refreshPrinterCurrentInterval);
    super.close();
  }

  async sendThrottle(throttle: number = AppConstants.defaultSocketThrottleRate): Promise<void> {
    return await this.sendMessage(JSON.stringify({ throttle }));
  }

  async reauthSession() {
    this.logger.log("Sending reauthSession");
    await this.setupSocketSession();
    await this.sendAuth();
    this.resetReauthRequired();
  }

  /**
   * Retrieve session token by authenticating with OctoPrint API
   */
  async setupSocketSession(): Promise<void> {
    this.resetSocketState();
    this.sessionDto = await this.octoprintClient
      .login(this.login)
      .then((d) => {
        const r = d.data;
        // Check response for red flags
        if (r.name === "_api") {
          // TODO this conclusion is often wrong (when server is disconnected)
          this.setApiState("globalKey");
          this.setSocketState("aborted");
          throw new ExternalServiceError("Global API Key detected, aborting socket connection", "OctoPrint");
        } else if (r.needs?.group[0] === "guests") {
          this.logger.warn("Detected group guests in OctoPrint login response, marking as unauthorized");
          // This doesn't occur often (instead a 400 with CSRF failed is returned)
          this.setApiState("authFail");
          this.setSocketState("aborted");
          throw new ExternalServiceError(
            "Guest group detected, authentication failed, aborting socket connection",
            "OctoPrint",
          );
        }
        this.setApiState("responding");
        this.setSocketState("opening");
        return r;
      })
      .catch((e: AxiosError) => {
        this.setSocketState("aborted");
        // TODO improve error type detection
        if (e instanceof ExternalServiceError) {
          this.logger.warn(`Printer authorization error, apiState: ${this.apiState}`);
          throw e;
        } else {
          if (e?.response?.status === 403) {
            this.setApiState("authFail");
            this.setSocketState("aborted");
            throw new ExternalServiceError(e, "OctoPrint");
          }
          // We make an exception for such a problem concerning log anonymization
          this.logger.error(`Printer (${this.printerId}) network or transport error, marking it as unreachable; ${e}`);
          this.setApiState("noResponse");
        }
        throw e;
      });

    this.username = await this.octoprintClient.getAdminUserOrDefault(this.login).catch((e: AxiosError) => {
      const status = e.response?.status;

      this.setApiState("authFail");
      this.setSocketState("aborted");

      if (
        status &&
        [
          HttpStatusCode.BAD_GATEWAY,
          HttpStatusCode.NOT_IMPLEMENTED,
          HttpStatusCode.SERVICE_UNAVAILABLE,
          HttpStatusCode.GATEWAY_TIMEOUT,
        ].includes(status)
      ) {
        this.logger.error(`Detected a 501-504 error (${status}) probably OctoPrint has crashed or is restarting`);
      }
      throw e;
    });

    await this.updateCurrentStateSafely();

    this.logger.log(`Setting up printer current interval loop with 10 seconds interval`);
    if (this.refreshPrinterCurrentInterval) {
      clearInterval(this.refreshPrinterCurrentInterval);
    }
    this.refreshPrinterCurrentInterval = setInterval(async () => {
      await this.updateCurrentStateSafely();
      // This timeout should be greater than or equal to the API timeout
    }, 10000);
  }

  setReauthRequired() {
    this.reauthRequired = true;
    this.reauthRequiredTimestamp = Date.now();
  }

  resetReauthRequired() {
    this.reauthRequired = false;
    this.reauthRequiredTimestamp = null;
  }

  resetSocketState() {
    this.setSocketState("unopened");
    this.setApiState("unset");
  }

  emitEventSync(event: string, payload: any) {
    if (!this.eventEmittingAllowed) {
      return;
    }

    this.eventEmitter2.emit(octoPrintEvent(event), {
      event,
      payload,
      printerId: this.printerId,
      printerType: OctoprintType,
    } as OctoPrintEventDto);
  }

  protected async afterOpened(_: WsEvent): Promise<void> {
    this.setSocketState("opened");
    await this.sendAuth();
    await this.sendThrottle(AppConstants.defaultSocketThrottleRate);
  }

  protected async onMessage(message: string): Promise<void> {
    this.lastMessageReceivedTimestamp = Date.now();

    if (this.socketState !== SOCKET_STATE.authenticated) {
      this.setSocketState("authenticated");
    }

    const data = JSON.parse(message);
    const eventName = Object.keys(data)[0];
    const payload = data[eventName];

    if (this._debugMode) {
      this.logger.log(`RX Msg ${eventName} ${message.substring(0, 140)}...`);
    }

    if (eventName === OctoPrintMessage.reauthRequired) {
      this.logger.log("Received 'reauthRequired', acting on it");
      this.setReauthRequired();
    }

    await this.emitEvent(eventName, payload);
  }

  protected async afterClosed(event: any) {
    this.setSocketState("closed");
    delete this.socket;
    await this.emitEvent(WsMessage.WS_CLOSED, "connection closed");
  }

  protected async onError(error: any) {
    this.setSocketState("error");
    await this.emitEvent(WsMessage.WS_ERROR, error?.length ? error : "connection error");
  }

  /**
   * Re-fetch the printer current state without depending on Websocket
   * @private
   */
  private async updateCurrentStateSafely() {
    try {
      const current = await this.octoprintClient.getPrinterCurrent(this.login, true);
      const isOperational = current.data?.state?.flags?.operational;

      let job = {} as CurrentJobDto;
      if (isOperational) {
        const jobResponse = await this.octoprintClient.getJob(this.login);
        job = jobResponse.data;
      }

      this.setApiState(API_STATE.responding);
      return await this.emitEvent("current", { ...current.data, progress: job?.progress, job: job?.job });
    } catch (e) {
      if ((e as AxiosError).isAxiosError) {
        const castError = e as OctoprintErrorDto;
        if (castError?.response?.status == 409) {
          this.logger.error(`Printer current interval loop error`);
          await this.emitEvent("current", {
            state: {
              flags: {
                operational: false,
                error: false,
              },
              text: "USB disconnected",
              error: castError?.response.data.error,
            },
          } as CurrentMessageDto);
          return;
        }
        this.logger.error(`Could not update Octoprint current due to a request error`);
        this.setApiState(API_STATE.noResponse);
        return;
      }
      this.logger.error(`Could not update Octoprint current due to an unknown error`);
      this.setApiState(API_STATE.noResponse);
    }
  }

  private async emitEvent(event: string, payload?: any) {
    if (!this.eventEmittingAllowed) {
      return;
    }

    await this.eventEmitter2.emitAsync(octoPrintEvent(event), {
      event,
      payload,
      printerId: this.printerId,
      printerType: 0,
    } as OctoPrintEventDto);
  }

  private async sendAuth(): Promise<void> {
    if (!this.sessionDto?.session?.length) {
      throw new Error("Cant send auth, session is unset.");
    }

    this.setSocketState(SOCKET_STATE.authenticating as SocketState);
    await this.sendMessage(
      JSON.stringify({
        auth: `${this.username}:${this.sessionDto.session}`,
      }),
    );
  }

  private setSocketState(state: SocketState) {
    this.socketState = state;
    this.stateUpdated = true;
    this.stateUpdateTimestamp = Date.now();
    if (this._debugMode) {
      this.logger.log(`${this.printerId} Socket state updated to: ` + state);
    }
    this.emitEventSync(WsMessage.WS_STATE_UPDATED, state);
  }

  private setApiState(state: ApiState) {
    if (state === API_STATE.globalKey) {
      this.logger.warn("Global API Key WS State detected");
    }
    this.apiState = state;
    this.apiStateUpdated = true;
    this.apiStateUpdateTimestamp = Date.now();
    if (this._debugMode) {
      this.logger.log(`${this.printerId} API state updated to: ` + state);
    }
    this.emitEventSync(WsMessage.API_STATE_UPDATED, state);
  }
}
