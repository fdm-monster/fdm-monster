const { Server } = require("socket.io");

class SocketIoGateway {
  #logger;
  #printersStore;
  #eventEmitter2;
  io;

  constructor({ loggerFactory, printersStore, eventEmitter2 }) {
    this.#logger = loggerFactory(SocketIoGateway.name);
    this.#printersStore = printersStore;
    this.#eventEmitter2 = eventEmitter2;
  }

  attachServer(httpServer) {
    this.io = new Server(httpServer, { cors: { origin: "*" } });
    const that = this;
    this.io.on("connection", (socket) => this.onConnect.bind(that)(socket));
  }

  onConnect(socket) {
    this.#logger.info("SocketIO Client connected", socket.id);

    socket.on("disconnect", () => {
      this.#logger.info("SocketIO Client disconnected", socket.id);
    });
  }

  send(event, serializedData) {
    // Legacy SSE replacement
    if (!this.io) {
      this.#logger.debug("No io server setup yet");
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
