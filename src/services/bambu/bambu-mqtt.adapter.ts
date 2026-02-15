import type { ILoggerFactory } from "@/handlers/logger-factory";
import EventEmitter2 from "eventemitter2";
import { SettingsStore } from "@/state/settings.store";
import { LoggerService } from "@/handlers/logger";
import { PrintData } from "@/services/bambu/mqtt-message.types";
import mqtt from "mqtt";
import type { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import type { ISocketLogin } from "@/shared/dtos/socket-login.dto";
import type { LoginDto } from "@/services/interfaces/login.dto";
import { SOCKET_STATE, SocketState } from "@/shared/dtos/socket-state.type";
import { API_STATE, ApiState } from "@/shared/dtos/api-state.type";
import { BambuType } from "@/services/printer-api.interface";
import { WsMessage } from "@/services/octoprint/octoprint-websocket.adapter";

export const bambuEvent = (event: string) => `bambu.${event}`;

export interface BambuEventDto {
  event: string;
  payload: any;
  printerId?: number;
  printerType: typeof BambuType;
}

export class BambuMqttAdapter implements IWebsocketAdapter {
  protected readonly logger: LoggerService;
  private readonly settingsStore: SettingsStore;
  private readonly eventEmitter2: EventEmitter2;

  public readonly printerType = BambuType;
  public printerId?: number;
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
  private sequenceIdCounter = 10;
  private isFirstMessage = true;

  constructor(settingsStore: SettingsStore, loggerFactory: ILoggerFactory, eventEmitter2: EventEmitter2) {
    this.settingsStore = settingsStore;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(BambuMqttAdapter.name);
  }

  registerCredentials(socketLogin: ISocketLogin): void {
    const { printerId, loginDto } = socketLogin;
    this.printerId = printerId;
    this.login = loginDto;

    this.host = loginDto.printerURL?.replace(/^https?:\/\//, "");
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
    return false;
  }

  isClosedOrAborted(): boolean {
    return this.socketState === SOCKET_STATE.closed || this.socketState === SOCKET_STATE.aborted;
  }

  async reauthSession(): Promise<void> {
    this.logger.debug("reauthSession called but not needed for Bambu");
  }

  open(): void {
    if (!this.host || !this.accessCode || !this.serial) {
      throw new Error("Cannot open connection: credentials not registered");
    }

    this.connect(this.host, this.accessCode, this.serial);
  }

  close(): void {
    this.disconnect().catch((err) => {
      this.logger.error("Error during MQTT disconnect:", err);
    });
  }

  async setupSocketSession(): Promise<void> {
    // For Bambu, we just need to validate credentials are set
    if (!this.host || !this.accessCode || !this.serial) {
      this.updateSocketState(SOCKET_STATE.aborted);
      this.updateApiState(API_STATE.noResponse);
      throw new Error("Credentials not properly registered");
    }

    this.updateSocketState(SOCKET_STATE.opening);
    this.updateApiState(API_STATE.responding);
  }

  allowEmittingEvents(): void {
    this.eventsAllowed = true;
  }

  disallowEmittingEvents(): void {
    this.eventsAllowed = false;
  }

  connect(host: string, accessCode: string, serial: string): void {
    if (this.mqttClient?.connected) {
      this.logger.debug("MQTT already connected");
      this.updateSocketState(SOCKET_STATE.opened);
      return;
    }

    if (this.isConnecting) {
      this.logger.warn("Connection already in progress");
      return;
    }

    this.host = host;
    this.accessCode = accessCode;
    this.serial = serial;
    this.isConnecting = true;
    this.updateSocketState(SOCKET_STATE.opening);

    const mqttUrl = `mqtts://${host}:8883`;
    const timeout = this.settingsStore.getTimeoutSettings().apiTimeout;

    this.logger.log(`Connecting to Bambu MQTT at ${mqttUrl}`);

    const connectionTimeout = setTimeout(() => {
      this.isConnecting = false;
      this.updateSocketState(SOCKET_STATE.error);
      this.logger.error("MQTT connection timeout - will keep trying to reconnect");
      // Don't force end - let mqtt.js handle reconnection automatically
      // The close event handler will handle cleanup if needed
    }, timeout);

    try {
      this.mqttClient = mqtt.connect(mqttUrl, {
        username: "bblp",
        password: accessCode,
        reconnectPeriod: 5000,
        rejectUnauthorized: false,
      });

      this.mqttClient.on("connect", () => {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.updateSocketState(SOCKET_STATE.authenticated);
        this.updateApiState(API_STATE.responding);
        this.logger.log("MQTT connected successfully");
        this.logger.debug(`Connected to MQTT broker at mqtts://${host}:8883`);

        const reportTopic = `device/${serial}/report`;
        this.mqttClient!.subscribe(reportTopic, { qos: 0 }, (err) => {
          if (err) {
            this.logger.error(`Failed to subscribe to ${reportTopic}:`, err);
            this.updateSocketState(SOCKET_STATE.error);
          } else {
            this.logger.debug(`Subscribed to ${reportTopic}`);

            this.sendPushallCommand().catch((err) => {
              this.logger.error("Failed to send pushall command:", err);
            });
          }
        });
      });

      this.mqttClient.on("error", (error) => {
        this.isConnecting = false;
        this.updateSocketState(SOCKET_STATE.error);
        this.emitEvent(WsMessage.WS_ERROR, error.message).catch(() => {});
        this.logger.error("MQTT error:", error);
      });

      this.mqttClient.on("message", (topic, message) => {
        this.lastMessageReceivedTimestamp = Date.now();
        this.handleMessage(topic, message);
      });

      this.mqttClient.on("disconnect", () => {
        this.updateSocketState(SOCKET_STATE.closed);
        this.emitEvent(WsMessage.WS_CLOSED, "disconnected").catch(() => {});
        this.logger.warn("MQTT disconnected");
      });

      this.mqttClient.on("reconnect", () => {
        this.updateSocketState(SOCKET_STATE.opening);
        this.logger.log("MQTT attempting to reconnect...");
        // Reset first message flag so we log on reconnection
        this.isFirstMessage = true;
      });

      this.mqttClient.on("close", () => {
        this.updateSocketState(SOCKET_STATE.closed);
        this.updateApiState(API_STATE.noResponse);
        this.emitEvent(WsMessage.WS_CLOSED, "connection closed").catch(() => {});
        this.logger.warn("MQTT connection closed - automatic reconnection will be attempted");

        // Emit a "current" event with offline state so frontend updates
        if (this.lastState) {
          const offlineMessage = this.transformStateToCurrentMessage(this.lastState);
          this.emitEvent("current", { ...offlineMessage, print: this.lastState }).catch(() => {});
        }

        // Don't call cleanup() here - it destroys the client and prevents reconnection
        // cleanup() will be called in disconnect() when we intentionally close
      });

      this.mqttClient.on("offline", () => {
        this.updateSocketState(SOCKET_STATE.closed);
        this.updateApiState(API_STATE.noResponse);
        this.logger.warn("MQTT client offline - automatic reconnection will be attempted");

        if (this.lastState) {
          const offlineMessage = this.transformStateToCurrentMessage(this.lastState);
          this.emitEvent("current", { ...offlineMessage, print: this.lastState }).catch(() => {});
        }
      });
    } catch (error) {
      clearTimeout(connectionTimeout);
      this.isConnecting = false;
      this.updateSocketState(SOCKET_STATE.error);
      this.logger.error("Failed to create MQTT client:", error);
      this.cleanup();
    }
  }

  async disconnect(): Promise<void> {
    if (!this.mqttClient) {
      this.updateSocketState(SOCKET_STATE.closed);
      return;
    }

    this.logger.log("Disconnecting MQTT");
    this.updateSocketState(SOCKET_STATE.closed);

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

  getLastState(): PrintData | null {
    return this.lastState;
  }

  private async sendPushallCommand(): Promise<void> {
    const payload = {
      pushing: {
        sequence_id: this.sequenceIdCounter,
        command: "pushall",
        version: 1,
        push_target: 1,
      },
    };

    this.logger.debug(`Sending command: ${JSON.stringify(payload)} with sequence ID: ${this.sequenceIdCounter}`);
    this.sequenceIdCounter++;

    await this.sendCommand(payload);
    this.logger.debug("Connected to printer via MQTT");
  }

  async sendCommand(payload: Record<string, any>): Promise<void> {
    if (!this.mqttClient?.connected) {
      throw new Error("MQTT not connected");
    }

    if (!this.serial) {
      throw new Error("Serial number not set");
    }

    const reportTopic = `device/${this.serial}/report`;
    const message = JSON.stringify(payload);

    return new Promise<void>((resolve, reject) => {
      this.mqttClient!.publish(reportTopic, message, { qos: 0 }, (err) => {
        if (err) {
          this.logger.error("Failed to send command:", err);
          reject(err);
        } else {
          this.logger.debug(`Command sent: ${message}`);
          resolve();
        }
      });
    });
  }

  async startPrint(
    filename: string,
    subtask_name?: string,
    amsMapping?: number[],
    plateNumber: number = 1,
  ): Promise<void> {
    await this.sendCommand({
      print: {
        command: "project_file",
        param: `Metadata/plate_${plateNumber}.gcode`,
        project_id: "0", // Always 0 for local prints
        profile_id: "0", // Always 0 for local prints
        task_id: "0", // Always 0 for local prints
        subtask_id: "0", // Always 0 for local prints
        subtask_name: subtask_name ?? filename,

        file: "", // Filename to print, not needed when "url" is specified with filepath
        url: `file:///${filename}`, // URL to print. Root path, protocol can vary. E.g., if sd card, "ftp:///myfile.3mf", "ftp:///cache/myotherfile.3mf"
        md5: "",

        timelapse: true,
        bed_type: "auto", // Always "auto" for local prints
        bed_levelling: true,
        flow_cali: true,
        vibration_cali: true,
        layer_inspect: true,

        // AMS mapping: array where each index represents a filament color in your gcode
        // and the value is the AMS slot number (0-3) to use, or -1 to skip
        // Example: [0, 2, -1, 1] means: color 0 uses slot 0, color 1 uses slot 2, color 2 skipped, color 3 uses slot 1
        ams_mapping: amsMapping ? amsMapping.join(",") : "", // Convert [0, 1, 2, 3] to "0,1,2,3"
        use_ams: !!amsMapping && amsMapping.length > 0,

        sequence_id: this.sequenceIdCounter++,
      },
    });
  }

  async pausePrint(): Promise<void> {
    await this.sendCommand({
      print: {
        command: "pause",
        sequence_id: this.sequenceIdCounter++,
      },
    });
  }

  async resumePrint(): Promise<void> {
    await this.sendCommand({
      print: {
        command: "resume",
        sequence_id: this.sequenceIdCounter++,
      },
    });
  }

  async stopPrint(): Promise<void> {
    await this.sendCommand({
      print: {
        command: "stop",
        sequence_id: this.sequenceIdCounter++,
      },
    });
  }

  async sendGcode(gcode: string): Promise<void> {
    await this.sendCommand({
      print: {
        command: "gcode_line",
        param: gcode,
        sequence_id: this.sequenceIdCounter++,
      },
    });
  }

  resetSocketState(): void {
    this.lastState = null;
  }

  private updateSocketState(state: SocketState): void {
    this.socketState = state;
    this.emitEventSync(WsMessage.WS_STATE_UPDATED, state);
  }

  private updateApiState(state: ApiState): void {
    this.apiState = state;
    this.emitEventSync(WsMessage.API_STATE_UPDATED, state);
  }

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

  private transformStateToCurrentMessage(state: PrintData): any {
    const isPrinting = state.gcode_state === "PRINTING" || state.mc_print_stage === "printing";
    const isPaused = state.mc_print_stage === "paused";

    // Check if connection is alive
    const isConnected = this.mqttClient?.connected || false;
    const hasError = !isConnected || state.print_error !== 0;

    const isPausedText = isPaused ? "Paused" : "Printing";

    const onlineText = isPrinting ? isPausedText : "Operational";
    return {
      state: {
        text: isConnected ? onlineText : "Offline",
        flags: {
          operational: isConnected,
          printing: isConnected && isPrinting && !isPaused,
          paused: isConnected && isPaused,
          ready: isConnected && !isPrinting,
          error: hasError,
          cancelling: false,
          pausing: false,
          sdReady: isConnected,
          closedOrError: !isConnected,
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

  private handleMessage(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());

      if (topic.endsWith("/report") && payload.print) {
        this.lastState = payload.print as PrintData;

        if (this.isFirstMessage) {
          this.logger.debug("Initial message received");
          this.isFirstMessage = false;
        }

        // Emit combined payload:
        // - Transformed format for UI (state, temps, progress, job)
        // - Raw print object for PrinterEventsCache job tracking
        const currentMessage = this.transformStateToCurrentMessage(this.lastState);
        const combinedPayload = {
          ...currentMessage,
          print: payload.print, // Include raw print data for job tracking
        };
        this.emitEvent("current", combinedPayload).catch((err) => {
          this.logger.error("Failed to emit current event:", err);
        });
      }
    } catch (error) {
      this.logger.error("Failed to parse MQTT message:", error);
    }
  }

  private cleanup(): void {
    if (this.mqttClient) {
      this.mqttClient.removeAllListeners();
      this.mqttClient = null;
    }
    this.isConnecting = false;
    this.lastState = null;
  }
}
