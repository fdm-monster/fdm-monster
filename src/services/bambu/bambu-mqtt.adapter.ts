import { ILoggerFactory } from "@/handlers/logger-factory";
import EventEmitter2 from "eventemitter2";
import { SettingsStore } from "@/state/settings.store";
import { LoggerService } from "@/handlers/logger";
import { PrintData } from "@/services/bambu/mqtt-message.types";
import mqtt from "mqtt";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { ISocketLogin } from "@/shared/dtos/socket-login.dto";
import { LoginDto } from "@/services/interfaces/login.dto";
import { SOCKET_STATE, SocketState } from "@/shared/dtos/socket-state.type";
import { API_STATE, ApiState } from "@/shared/dtos/api-state.type";
import { BambuType } from "@/services/printer-api.interface";
import { IdType } from "@/shared.constants";

export const bambuEvent = (event: string) => `bambu.${event}`;

export interface BambuEventDto {
  event: string;
  payload: any;
  printerId?: IdType;
  printerType: typeof BambuType;
}

/**
 * Adapter for Bambu Lab MQTT communication
 * Implements direct MQTT connection to Bambu Lab printers
 */
export class BambuMqttAdapter implements IWebsocketAdapter {
  protected readonly logger: LoggerService;
  private readonly settingsStore: SettingsStore;
  private readonly eventEmitter2: EventEmitter2;

  // IWebsocketAdapter required properties
  public readonly printerType = BambuType;
  public printerId?: IdType;
  public socketState: SocketState = SOCKET_STATE.unopened;
  public apiState: ApiState = API_STATE.unset;
  public login: LoginDto;
  public lastMessageReceivedTimestamp: null | number = null;

  private mqttClient: mqtt.MqttClient | null = null;
  private host: string | null = null;
  private accessCode: string | null = null;
  private serial: string | null = null;
  private lastState: PrintData | null = null;
  private isConnecting = false;
  private eventsAllowed = true;

  constructor(
    settingsStore: SettingsStore,
    loggerFactory: ILoggerFactory,
    eventEmitter2: EventEmitter2
  ) {
    this.settingsStore = settingsStore;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(BambuMqttAdapter.name);
  }

  // IWebsocketAdapter required methods
  registerCredentials(socketLogin: ISocketLogin): void {
    const { printerId, loginDto } = socketLogin;
    this.printerId = printerId;
    this.login = loginDto;

    // Extract connection details from loginDto
    this.host = loginDto.printerURL?.replace(/^https?:\/\//, '');
    this.accessCode = loginDto.password || null;
    this.serial = loginDto.username || null;
  }

  needsReopen(): boolean {
    const isApiOnline = this.apiState === API_STATE.responding;
    return isApiOnline && (this.socketState === SOCKET_STATE.closed || this.socketState === SOCKET_STATE.error);
  }

  needsSetup(): boolean {
    return this.socketState === SOCKET_STATE.unopened;
  }

  needsReauth(): boolean {
    return false; // Bambu doesn't require reauth like OctoPrint
  }

  isClosedOrAborted(): boolean {
    return this.socketState === SOCKET_STATE.closed || this.socketState === SOCKET_STATE.aborted;
  }

  async reauthSession(): Promise<void> {
    // Bambu doesn't need reauthentication
    this.logger.debug("reauthSession called but not needed for Bambu");
  }

  open(): void {
    if (!this.host || !this.accessCode || !this.serial) {
      throw new Error("Cannot open connection: credentials not registered");
    }

    this.connect(this.host, this.accessCode, this.serial).catch((err) => {
      this.logger.error("Failed to open MQTT connection: " + err.toString());
      this.socketState = SOCKET_STATE.error;
    });
  }

  close(): void {
    this.disconnect().catch((err) => {
      this.logger.error("Error during MQTT disconnect:", err);
    });
  }

  async setupSocketSession(): Promise<void> {
    // For Bambu, we just need to validate credentials are set
    if (!this.host || !this.accessCode || !this.serial) {
      this.socketState = SOCKET_STATE.aborted;
      this.apiState = API_STATE.noResponse;
      throw new Error("Credentials not properly registered");
    }

    this.socketState = SOCKET_STATE.opening;
    this.apiState = API_STATE.responding;
  }

  allowEmittingEvents(): void {
    this.eventsAllowed = true;
  }

  disallowEmittingEvents(): void {
    this.eventsAllowed = false;
  }

  /**
   * Connect to printer MQTT broker
   */
  async connect(host: string, accessCode: string, serial: string): Promise<void> {
    if (this.mqttClient?.connected) {
      this.logger.debug("MQTT already connected");
      this.socketState = SOCKET_STATE.opened;
      return;
    }

    if (this.isConnecting) {
      throw new Error("Connection already in progress");
    }

    this.host = host;
    this.accessCode = accessCode;
    this.serial = serial;
    this.isConnecting = true;
    this.socketState = SOCKET_STATE.opening;

    const mqttUrl = `mqtt://${host}:1883`;
    const timeout = this.settingsStore.getTimeoutSettings().apiTimeout;

    this.logger.log(`Connecting to Bambu MQTT at ${mqttUrl}`);

    return new Promise<void>((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        this.isConnecting = false;
        this.socketState = SOCKET_STATE.error;
        this.cleanup();
        reject(new Error("MQTT connection timeout"));
      }, timeout);

      try {
        this.mqttClient = mqtt.connect(mqttUrl, {
          username: "bblp",
          password: accessCode,
          clientId: `fdm_monster_${serial}_${Date.now()}`,
          protocol: "mqtt",
          connectTimeout: timeout,
          reconnectPeriod: 5000,
          keepalive: 60,
        });

        this.mqttClient.on("connect", () => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.socketState = SOCKET_STATE.authenticated;
          this.apiState = API_STATE.responding;
          this.logger.log("MQTT connected successfully");

          const reportTopic = `device/${serial}/report`;
          this.mqttClient!.subscribe(reportTopic, { qos: 0 }, (err) => {
            if (err) {
              this.logger.error(`Failed to subscribe to ${reportTopic}:`, err);
              this.socketState = SOCKET_STATE.error;
              reject(new Error(`Subscribe failed: ${err.message}`));
            } else {
              this.logger.debug(`Subscribed to ${reportTopic}`);
              resolve();
            }
          });
        });

        this.mqttClient.on("error", (error) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.socketState = SOCKET_STATE.error;
          this.logger.error("MQTT error:", error);

          if (!this.mqttClient?.connected) {
            reject(error);
          }
        });

        this.mqttClient.on("message", (topic, message) => {
          this.lastMessageReceivedTimestamp = Date.now();
          this.handleMessage(topic, message);
        });

        this.mqttClient.on("disconnect", () => {
          this.socketState = SOCKET_STATE.closed;
          this.logger.warn("MQTT disconnected");
        });

        this.mqttClient.on("reconnect", () => {
          this.socketState = SOCKET_STATE.opening;
          this.logger.debug("MQTT reconnecting...");
        });

        this.mqttClient.on("close", () => {
          this.socketState = SOCKET_STATE.closed;
          this.logger.debug("MQTT connection closed");
        });

      } catch (error) {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.socketState = SOCKET_STATE.error;
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Disconnect MQTT
   */
  async disconnect(): Promise<void> {
    if (!this.mqttClient) {
      this.socketState = SOCKET_STATE.closed;
      return;
    }

    this.logger.log("Disconnecting MQTT");
    this.socketState = SOCKET_STATE.closed;

    return new Promise<void>((resolve) => {
      if (this.mqttClient?.connected) {
        this.mqttClient.end(false, {}, () => {
          this.cleanup();
          resolve();
        });
      } else {
        this.cleanup();
        resolve();
      }
    });
  }

  /**
   * Get last received printer state
   */
  getLastState(): PrintData | null {
    return this.lastState;
  }

  /**
   * Send command to printer via MQTT
   */
  async sendCommand(payload: Record<string, any>): Promise<void> {
    if (!this.mqttClient?.connected) {
      throw new Error("MQTT not connected");
    }

    if (!this.serial) {
      throw new Error("Serial number not set");
    }

    const requestTopic = `device/${this.serial}/request`;
    const message = JSON.stringify(payload);

    return new Promise<void>((resolve, reject) => {
      this.mqttClient!.publish(requestTopic, message, { qos: 0 }, (err) => {
        if (err) {
          this.logger.error("Failed to send command:", err);
          reject(err);
        } else {
          this.logger.debug("Command sent:", payload);
          resolve();
        }
      });
    });
  }

  /**
   * Start print job
   */
  async startPrint(filename: string): Promise<void> {
    await this.sendCommand({
      print: {
        command: "project_file",
        param: filename,
        url: `file:///sdcard/${filename}`,
        subtask_name: filename,
        sequence_id: String(Date.now()),
      },
    });
  }

  /**
   * Pause print
   */
  async pausePrint(): Promise<void> {
    await this.sendCommand({
      print: {
        command: "pause",
        sequence_id: String(Date.now()),
      },
    });
  }

  /**
   * Resume print
   */
  async resumePrint(): Promise<void> {
    await this.sendCommand({
      print: {
        command: "resume",
        sequence_id: String(Date.now()),
      },
    });
  }

  /**
   * Stop/cancel print
   */
  async stopPrint(): Promise<void> {
    await this.sendCommand({
      print: {
        command: "stop",
        sequence_id: String(Date.now()),
      },
    });
  }

  /**
   * Send custom GCode
   */
  async sendGcode(gcode: string): Promise<void> {
    await this.sendCommand({
      print: {
        command: "gcode_line",
        param: gcode,
        sequence_id: String(Date.now()),
      },
    });
  }

  /**
   * Reset socket state
   */
  resetSocketState(): void {
    this.lastState = null;
  }

  /**
   * Emit event (async)
   */
  private async emitEvent(event: string, payload?: any): Promise<void> {
    if (!this.eventsAllowed) {
      return;
    }

    await this.eventEmitter2.emitAsync(bambuEvent(event), {
      event,
      payload,
      printerId: this.printerId,
      printerType: BambuType,
    } as BambuEventDto);
  }

  /**
   * Emit event (sync)
   */
  private emitEventSync(event: string, payload: any): void {
    if (!this.eventsAllowed) {
      return;
    }

    this.eventEmitter2.emit(bambuEvent(event), {
      event,
      payload,
      printerId: this.printerId,
      printerType: BambuType,
    } as BambuEventDto);
  }

  /**
   * Transform Bambu state to frontend-compatible format
   */
  private transformStateToCurrentMessage(state: PrintData): any {
    const isPrinting = state.gcode_state === "PRINTING" || state.mc_print_stage === "printing";
    const isPaused = state.mc_print_stage === "paused";

    const isPausedText = isPaused ? "Paused" : "Printing"
    return {
      state: {
        text: isPrinting ? isPausedText : "Operational",
        flags: {
          operational: true,
          printing: isPrinting && !isPaused,
          paused: isPaused,
          ready: !isPrinting,
          error: state.print_error !== 0,
          cancelling: false,
          pausing: false,
          sdReady: true,
          closedOrError: false,
        },
      },
      temps: [
        {
          time: Date.now(),
          tool0: {
            actual: state.nozzle_temper || 0,
            target: state.nozzle_target_temper || 0,
          },
          bed: {
            actual: state.bed_temper || 0,
            target: state.bed_target_temper || 0,
          },
          chamber: {
            actual: state.chamber_temper || 0,
            target: 0,
          },
        },
      ],
      progress: {
        completion: state.mc_percent || 0,
        printTime: null,
        printTimeLeft: state.mc_remaining_time ? state.mc_remaining_time * 60 : null,
      },
      job: {
        file: {
          name: state.gcode_file || state.subtask_name || null,
        },
      },
      currentZ: state.layer_num || null,
      offsets: {},
      resends: { count: 0, transmitted: 0, ratio: 0 },
      logs: [],
      messages: [],
    };
  }

  /**
   * Handle incoming MQTT message
   */
  private handleMessage(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());

      if (topic.endsWith("/report") && payload.print) {
        this.lastState = payload.print as PrintData;
        this.logger.debug("Received printer state update");

        // Transform and emit current state
        const currentMessage = this.transformStateToCurrentMessage(this.lastState);
        this.emitEvent("current", currentMessage).catch((err) => {
          this.logger.error("Failed to emit current event:", err);
        });
      }
    } catch (error) {
      this.logger.error("Failed to parse MQTT message:", error);
    }
  }

  /**
   * Cleanup MQTT client
   */
  private cleanup(): void {
    if (this.mqttClient) {
      this.mqttClient.removeAllListeners();
      this.mqttClient = null;
    }
    this.lastState = null;
  }
}
