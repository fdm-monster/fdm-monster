import { WebsocketAdapter } from "@/shared/websocket.adapter";
import { MoonrakerClient } from "@/services/moonraker/moonraker.client";
import { ILoggerFactory } from "@/handlers/logger-factory";
import EventEmitter2 from "eventemitter2";
import { ConfigService } from "@/services/core/config.service";
import { IPrinterSocketLogin, PrinterLoginDto } from "@/shared/dtos/printer-login.dto";
import { LoggerService } from "@/handlers/logger";
import { OctoPrintSessionDto } from "@/services/octoprint/dto/octoprint-session.dto";
import { IdType } from "@/shared.constants";
import { AppConstants } from "@/server.constants";
import { normalizeUrl } from "@/utils/normalize-url";
import { httpToWsUrl } from "@/utils/url.utils";
import { OctoPrintEventDto } from "@/services/octoprint/dto/octoprint-event.dto";
import {
  API_STATE,
  ApiStateType,
  OctoPrintMessage,
  octoPrintEvent,
  SOCKET_STATE,
  SocketStateType,
  WsMessage,
} from "@/services/octoprint/octoprint-sockio.adapter";
import { moonrakerEvent, MoonrakerEventDto } from "@/services/moonraker/constants/websocket.constants";
import { writeFileSync } from "node:fs";

export class MoonrakerWebsocketAdapter extends WebsocketAdapter {
  public readonly printerType = 1;
  private moonrakerClient: MoonrakerClient;
  protected logger: LoggerService;
  private eventEmitter: EventEmitter2;
  private configService: ConfigService;
  socketState = SOCKET_STATE.unopened;
  lastMessageReceivedTimestamp: null | number = null;
  stateUpdated = false;
  stateUpdateTimestamp: null | number = null;
  apiStateUpdated = false;
  apiStateUpdateTimestamp: null | number = null;
  apiState = API_STATE.unset;
  loginDto?: PrinterLoginDto;
  private socketURL?: URL;
  private sessionDto?: OctoPrintSessionDto;
  public printerId?: IdType;
  private username?: string;

  constructor({
    moonrakerClient,
    loggerFactory,
    eventEmitter2,
    configService,
  }: {
    moonrakerClient: MoonrakerClient;
    loggerFactory: ILoggerFactory;
    eventEmitter2: EventEmitter2;
    configService: ConfigService;
  }) {
    super({ loggerFactory });
    this.moonrakerClient = moonrakerClient;
    this.logger = loggerFactory(MoonrakerWebsocketAdapter.name);
    this.eventEmitter = eventEmitter2;
    this.configService = configService;
  }

  get _debugMode() {
    return this.configService.get(AppConstants.debugSocketStatesKey, AppConstants.defaultDebugSocketStates) === "true";
  }

  needsReopen() {
    return false;
  }

  needsSetup() {
    return this.socketState === SOCKET_STATE.unopened;
  }

  // needsReset() {
  //   return this.apiState === API_STATE.resetting;
  // }

  needsReauth() {
    return false;
  }

  registerCredentials(socketLogin: IPrinterSocketLogin) {
    const { printerId, loginDto, protocol } = socketLogin;
    this.printerId = printerId;
    this.loginDto = loginDto;

    const httpUrl = normalizeUrl(this.loginDto.printerURL);
    const wsUrl = httpToWsUrl(httpUrl, protocol);
    wsUrl.pathname = "/websocket";
    this.socketURL = wsUrl;
  }

  open() {
    if (this.socket) {
      throw new Error(`Socket already exists by printerId, ignoring open request`);
    }
    super.open(this.socketURL);
  }

  close() {
    super.close();
  }

  async setupSocketSession(): Promise<void> {
    // Check if auth required
    const oneshot = await this.moonrakerClient.getAccessOneshotToken(this.loginDto);
    this.logger.log(`Oneshot ${oneshot.data.result}`);
    // await this.moonrakerClient.getAccessOneshotToken();
  }

  emitEventSync(event: string, payload: any) {
    this.eventEmitter.emit(moonrakerEvent(event), {
      event,
      payload,
      printerId: this.printerId,
    } as OctoPrintEventDto);
  }

  resetSocketState() {
    this.setSocketState("unopened");
    this.setApiState("unset");
  }

  isClosedOrAborted() {
    return this.socketState === SOCKET_STATE.closed || this.socketState === SOCKET_STATE.aborted;
  }

  protected async afterOpened(event: any): Promise<void> {
    this.setSocketState("opened");
  }

  protected async onMessage(message: string): Promise<void> {
    this.lastMessageReceivedTimestamp = Date.now();

    if (this.socketState !== SOCKET_STATE.authenticated) {
      this.setSocketState("authenticated");
    }

    const data = JSON.parse(message);
    const eventName = data.method;
    const payload = data.params?.length ? data.params[0] : undefined;

    if (eventName === "notify_proc_stat_update") return;

    // if (this._debugMode) {
    //   this.logger.log(`RX Msg ${eventName} ${JSON.stringify(data.params)?.substring(0, 80)}...`);
    // }

    // Emit the message to the event bus
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

  private async emitEvent(event: string, payload?: any) {
    await this.eventEmitter.emitAsync(moonrakerEvent(event), {
      event,
      payload,
      printerId: this.printerId,
      printerType: 1,
    } as MoonrakerEventDto);
  }

  private setSocketState(state: SocketStateType) {
    this.socketState = state;
    this.stateUpdated = true;
    this.stateUpdateTimestamp = Date.now();
    if (this._debugMode) {
      this.logger.log(`${this.printerId} Socket state updated to: ` + state);
    }
    this.emitEventSync(WsMessage.WS_STATE_UPDATED, state);
  }

  private setApiState(state: ApiStateType) {
    this.apiState = state;
    this.apiStateUpdated = true;
    this.apiStateUpdateTimestamp = Date.now();
    if (this._debugMode) {
      this.logger.log(`${this.printerId} API state updated to: ` + state);
    }
    this.emitEventSync(WsMessage.API_STATE_UPDATED, state);
  }
}
