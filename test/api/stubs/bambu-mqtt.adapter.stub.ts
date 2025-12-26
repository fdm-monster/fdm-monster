import { ILoggerFactory } from "@/handlers/logger-factory";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { PrintData } from "@/services/bambu/mqtt-message.types";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { ISocketLogin } from "@/shared/dtos/socket-login.dto";
import { LoginDto } from "@/services/interfaces/login.dto";
import { SOCKET_STATE, SocketState } from "@/shared/dtos/socket-state.type";
import { API_STATE, ApiState } from "@/shared/dtos/api-state.type";
import { BambuType } from "@/services/printer-api.interface";
import { IdType } from "@/shared.constants";
import { WsMessage } from "@/services/octoprint/octoprint-websocket.adapter";

export const bambuEvent = (event: string) => `bambu.${event}`;

export interface BambuEventDto {
  event: string;
  payload: any;
  printerId?: IdType;
  printerType: typeof BambuType;
}

/**
 * Stub implementation of BambuMqttAdapter for testing
 * Avoids actual MQTT connections while maintaining the same interface
 */
export class BambuMqttAdapterStub implements IWebsocketAdapter {
  protected readonly logger: LoggerService;
  private readonly eventEmitter2: EventEmitter2;

  // IWebsocketAdapter required properties
  public readonly printerType = BambuType;
  public printerId?: IdType;
  public socketState: SocketState = SOCKET_STATE.unopened;
  public apiState: ApiState = API_STATE.unset;
  public login!: LoginDto;
  public lastMessageReceivedTimestamp: null | number = null;

  private host: string | null = null;
  private accessCode: string | null = null;
  private serial: string | null = null;
  private lastState: PrintData | null = null;
  private isConnecting = false;
  private eventsAllowed = true;
  private connected = false;

  constructor(
    loggerFactory: ILoggerFactory,
    eventEmitter2: EventEmitter2
  ) {
    this.logger = loggerFactory("BambuMqttAdapterStub");
    this.eventEmitter2 = eventEmitter2;
  }

  /**
   * Register credentials for connection
   */
  registerCredentials(socketLogin: ISocketLogin): void {
    const login = socketLogin.loginDto;
    this.login = login;
    const host = this.extractHost(login.printerURL);
    this.host = host;
    this.accessCode = login.password || "";
    this.serial = login.username || "";

    this.logger.debug(`[STUB] Registered credentials for host ${host}`);
  }

  /**
   * Open connection (stubbed)
   */
  open(): void {
    if (!this.host || !this.accessCode || !this.serial) {
      throw new Error("Cannot open connection: credentials not registered");
    }

    this.connect(this.host, this.accessCode, this.serial).catch((err) => {
      this.logger.error("[STUB] Failed to open MQTT connection: " + err.toString());
      this.updateSocketState(SOCKET_STATE.error);
    });
  }

  /**
   * Close connection (stubbed)
   */
  close(): void {
    this.disconnect().catch((err) => {
      this.logger.error("[STUB] Error during MQTT disconnect:", err);
    });
  }

  /**
   * Connect to MQTT (stubbed)
   */
  private async connect(host: string, accessCode: string, serial: string): Promise<void> {
    if (this.connected) {
      this.logger.debug("[STUB] MQTT already connected");
      this.updateSocketState(SOCKET_STATE.authenticated);
      return;
    }

    if (this.isConnecting) {
      throw new Error("Connection already in progress");
    }

    this.isConnecting = true;
    this.updateSocketState(SOCKET_STATE.opening);

    this.logger.log(`[STUB] Connecting to Bambu MQTT at ${host}:8883`);

    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 100));

      this.connected = true;
      this.isConnecting = false;
      this.updateSocketState(SOCKET_STATE.authenticated);
      this.updateApiState(API_STATE.responding);
      this.lastMessageReceivedTimestamp = Date.now();

      this.logger.log("[STUB] MQTT connected successfully");

      // Emit mock connection event
      this.emitEvent("connected", { host, serial });

    } catch (error) {
      this.isConnecting = false;
      this.updateSocketState(SOCKET_STATE.error);
      this.logger.error("[STUB] MQTT connection failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect from MQTT (stubbed)
   */
  private async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.logger.log("[STUB] Disconnecting MQTT");

    this.connected = false;
    this.socketState = SOCKET_STATE.closed;
    this.apiState = API_STATE.unset;

    // Emit mock disconnect event
    this.emitEvent("disconnected", {});
  }

  /**
   * Start print job (stubbed)
   */
  async startPrint(filename: string): Promise<void> {
    if (!this.connected) {
      throw new Error("MQTT not connected");
    }

    this.logger.log(`[STUB] Starting print: ${filename}`);

    // Simulate command delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Emit mock print started event
    this.emitEvent("print_started", { filename });
  }

  /**
   * Pause print (stubbed)
   */
  async pausePrint(): Promise<void> {
    if (!this.connected) {
      throw new Error("MQTT not connected");
    }

    this.logger.log("[STUB] Pausing print");

    await new Promise(resolve => setTimeout(resolve, 50));

    this.emitEvent("print_paused", {});
  }

  /**
   * Resume print (stubbed)
   */
  async resumePrint(): Promise<void> {
    if (!this.connected) {
      throw new Error("MQTT not connected");
    }

    this.logger.log("[STUB] Resuming print");

    await new Promise(resolve => setTimeout(resolve, 50));

    this.emitEvent("print_resumed", {});
  }

  /**
   * Stop print (stubbed)
   */
  async stopPrint(): Promise<void> {
    if (!this.connected) {
      throw new Error("MQTT not connected");
    }

    this.logger.log("[STUB] Stopping print");

    await new Promise(resolve => setTimeout(resolve, 50));

    this.emitEvent("print_stopped", {});
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.connected && this.socketState === SOCKET_STATE.authenticated;
  }

  /**
   * Extract host from printer URL
   */
  private extractHost(printerURL: string): string {
    try {
      const url = new URL(printerURL);
      return url.hostname;
    } catch {
      // Fallback: assume it's already a host/IP
      return printerURL.replace(/^https?:\/\//, '').split(':')[0];
    }
  }

  /**
   * Update socket state and emit event
   */
  private updateSocketState(state: SocketState): void {
    this.socketState = state;
    this.emitEvent(WsMessage.WS_STATE_UPDATED, state);
  }

  /**
   * Update API state and emit event
   */
  private updateApiState(state: ApiState): void {
    this.apiState = state;
    this.emitEvent(WsMessage.API_STATE_UPDATED, state);
  }

  /**
   * Emit Bambu-specific event
   */
  private emitEvent(event: string, payload: any): void {
    if (!this.eventsAllowed) {
      return;
    }

    const eventData: BambuEventDto = {
      event,
      payload,
      printerId: this.printerId,
      printerType: BambuType,
    };

    this.eventEmitter2.emit(bambuEvent(event), eventData);
  }

  // IWebsocketAdapter required methods

  needsReopen(): boolean {
    return this.socketState === SOCKET_STATE.closed || this.socketState === SOCKET_STATE.error;
  }

  needsSetup(): boolean {
    return this.socketState === SOCKET_STATE.unopened;
  }

  needsReauth(): boolean {
    return false;
  }

  isClosedOrAborted(): boolean {
    return this.socketState === SOCKET_STATE.closed || this.socketState === SOCKET_STATE.aborted;
  }

  async reauthSession(): Promise<void> {
    this.logger.debug("[STUB] reauthSession called");
  }

  async setupSocketSession(): Promise<void> {
    this.logger.debug("[STUB] setupSocketSession called");
    if (!this.host || !this.accessCode || !this.serial) {
      this.updateSocketState(SOCKET_STATE.aborted);
      this.updateApiState(API_STATE.noResponse);
      throw new Error("Credentials not properly registered");
    }

    this.updateSocketState(SOCKET_STATE.opening);
    this.updateApiState(API_STATE.responding);
  }

  resetSocketState(): void {
    this.socketState = SOCKET_STATE.unopened;
    this.apiState = API_STATE.unset;
    this.connected = false;
  }

  allowEmittingEvents(): void {
    this.eventsAllowed = true;
  }

  disallowEmittingEvents(): void {
    this.eventsAllowed = false;
  }
}
