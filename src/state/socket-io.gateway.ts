import { Server, Socket } from "socket.io";
import { socketIoConnectedEvent } from "@/constants/event.constants";
import { SettingsStore } from "@/state/settings.store";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import * as http from "http";

export class SocketIoGateway {
  logger: LoggerService;
  eventEmitter2: EventEmitter2;
  io: Server;

  settingsStore: SettingsStore;

  constructor({
    loggerFactory,
    eventEmitter2,
    settingsStore,
  }: {
    loggerFactory: ILoggerFactory;
    eventEmitter2: EventEmitter2;
    settingsStore: SettingsStore;
  }) {
    this.logger = loggerFactory(SocketIoGateway.name);
    this.eventEmitter2 = eventEmitter2;
    this.settingsStore = settingsStore;
  }

  attachServer(httpServer: http.Server) {
    this.io = new Server(httpServer, { cors: { origin: "*" } });
    const that = this;
    this.io.on("connection", (socket) => this.onConnect.bind(that)(socket));
  }

  onConnect(socket: Socket) {
    this.logger.log("SocketIO Client connected", socket.id);
    this.eventEmitter2.emit(socketIoConnectedEvent, socket.id);

    socket.on("disconnect", () => {
      this.logger.log("SocketIO Client disconnected", socket.id);
    });
  }

  send<T>(event: string, data: T) {
    if (!this.io) {
      this.logger.debug("No io server setup yet");
      return;
    }

    if (this.settingsStore.getServerSettings().debugSettings?.debugSocketIoEvents) {
      this.logger.log(`Sending event ${event}`);
    }
    this.io.emit(event, data);
  }
}

export const IO_MESSAGES = {
  LegacyUpdate: "legacy-update",
  LegacyPrinterTest: "legacy-printer-test",
  CompletionEvent: "completion-event",
  HostState: "host-state",
  ApiAccessibility: "api-accessibility",
};
