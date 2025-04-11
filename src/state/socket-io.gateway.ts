import { Server, Socket } from "socket.io";
import { socketIoConnectedEvent } from "@/constants/event.constants";
import { SettingsStore } from "@/state/settings.store";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Server as HttpServer } from "http";
import { getPassportJwtOptions, verifyUserCallback } from "@/middleware/passport";
import { IConfigService } from "@/services/core/config.service";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { authorize } from "@/middleware/socketio.middleware";

export class SocketIoGateway {
  logger: LoggerService;

  io: Server;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly settingsStore: SettingsStore,
    private readonly userService: IUserService,
    private readonly configService: IConfigService
  ) {
    this.logger = loggerFactory(SocketIoGateway.name);
  }

  attachServer(httpServer: HttpServer) {
    this.io = new Server(httpServer, { cors: { origin: "*" } });
    const opts = getPassportJwtOptions(
      this.settingsStore,
      this.configService,
      (value: Socket) => value.handshake.auth.token
    );
    this.io.use(authorize(this.settingsStore, opts, verifyUserCallback(this.userService)));
    this.io.on("connection", (socket) => this.onConnect.bind(this)(socket));
  }

  onConnect(socket: Socket) {
    this.logger.debug("SocketIO Client connected", socket.id);

    this.eventEmitter2.emit(socketIoConnectedEvent, socket.id);

    socket.on("disconnect", () => {
      this.logger.debug("SocketIO Client disconnected", socket.id);
    });
  }

  send<T>(event: string, data: T) {
    if (!this.io) {
      this.logger.debug("No io server setup yet");
      return;
    }

    this.io.emit(event, data);
  }
}

export const IO_MESSAGES = {
  LegacyUpdate: "legacy-update",
  LegacyPrinterTest: "legacy-printer-test",
  CompletionEvent: "completion-event",
  HostState: "host-state",
  ApiAccessibility: "api-accessibility"
};
