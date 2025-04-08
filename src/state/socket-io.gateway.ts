import { Server, Socket } from "socket.io";
import { socketIoConnectedEvent } from "@/constants/event.constants";
import { SettingsStore } from "@/state/settings.store";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Server as HttpServer } from "http";
import { getPassportJwtOptions, verifyUserCallback } from "@/middleware/passport";
import { IConfigService } from "@/services/core/config.service";
import { Strategy as JwtStrategy, StrategyOptions, VerifiedCallback } from "passport-jwt";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { ExtendedError } from "socket.io/dist/namespace";
import { IUserService } from "@/services/interfaces/user-service.interface";

const authorize = (
  settingsStore: SettingsStore,
  options: StrategyOptions,
  verify: (jwt_payload: any, done: VerifiedCallback) => void,
) => {
  const strategy = new JwtStrategy(options, verify);

  return async function authorizeCallback(
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    next: (err?: ExtendedError) => void,
  ) {
    if (!(await settingsStore.getLoginRequired())) {
      // No login required, so we can skip the authentication
      return next();
    }
    // --- Begin strategy augmentation ala passport
    strategy.success = function success(user) {
      socket.handshake.user = user;
      next();
    };
    strategy.fail = (info) => next(new Error(info));
    strategy.error = (error) => next(error);

    strategy.authenticate(socket, {});
  };
};

export class SocketIoGateway {
  logger: LoggerService;

  io: Server;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly settingsStore: SettingsStore,
    private readonly userService: IUserService,
    private readonly configService: IConfigService,
  ) {
    this.logger = loggerFactory(SocketIoGateway.name);
  }

  attachServer(httpServer: HttpServer) {
    this.io = new Server(httpServer, { cors: { origin: "*" } });
    const opts = getPassportJwtOptions(
      this.settingsStore,
      this.configService,
      (value: Socket) => value.handshake.auth.token,
    );
    const verify = verifyUserCallback(this.userService);
    this.io.use(authorize(this.settingsStore, opts, verify));
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
  ApiAccessibility: "api-accessibility",
};
