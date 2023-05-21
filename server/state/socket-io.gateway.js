const { Server } = require("socket.io");
const { socketIoConnectedEvent } = require("../constants/event.constants");

class SocketIoGateway {
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

  constructor({ loggerFactory, eventEmitter2 }) {
    this.logger = loggerFactory(SocketIoGateway.name);
    this.eventEmitter2 = eventEmitter2;
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

  send(event, serializedData) {
    // Legacy SSE replacement
    if (!this.io) {
      this.logger.debug("No io server setup yet");
      return;
    }

    this.io.emit(event, serializedData);
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
