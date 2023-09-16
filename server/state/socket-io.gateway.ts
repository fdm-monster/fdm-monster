const { Server } = require("socket.io");
const { socketIoConnectedEvent } = require("../constants/event.constants");

export class SocketIoGateway {
  /**
   * @type {LoggerService}
   */
  logger;
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;
  /**
   * @type {Server}
   */
  io;

  /**
   * @type {SettingsStore}
   */
  settingsStore;

  constructor({ loggerFactory, eventEmitter2, settingsStore }) {
    this.logger = loggerFactory(SocketIoGateway.name);
    this.eventEmitter2 = eventEmitter2;
    this.settingsStore = settingsStore;
  }

  attachServer(httpServer) {
    this.io = new Server(httpServer, { cors: { origin: "*" } });
    const that = this;
    this.io.on("connection", (socket) => this.onConnect.bind(that)(socket));
  }

  onConnect(socket) {
    this.logger.log("SocketIO Client connected", socket.id);
    this.eventEmitter2.emit(socketIoConnectedEvent, socket.id);

    socket.on("disconnect", () => {
      this.logger.log("SocketIO Client disconnected", socket.id);
    });
  }

  send(event, data) {
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

module.exports = {
  SocketIoGateway,
  IO_MESSAGES: {
    LegacyUpdate: "legacy-update",
    LegacyPrinterTest: "legacy-printer-test",
    CompletionEvent: "completion-event",
    HostState: "host-state",
    ApiAccessibility: "api-accessibility",
  },
};
