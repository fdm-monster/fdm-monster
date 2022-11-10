const { Server } = require("socket.io");

const events = {
  PRINTER: "PRINTER",
  UPLOAD: "UPLOAD",
};

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
    this.io.on("request", () => {
      console.log("request");
    });

    this.#eventEmitter2.on("octoprint.*", (event, data) => {
      console.log("event");
      this.io.emit(event, JSON.stringify(data));
    });
  }

  onConnect(socket) {
    console.log("Client connected", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });

    socket.on("request", () => {
      console.log("request");
      socket.emit("printers", this.#printersStore.listPrinterStates());
    });

    this.io?.emit("message", "world");
  }

  pushPrinterUpdate(printerId, event, data) {
    console.log("Updating printer", printerId, !!this.io);
    if (!this.io) {
      this.#logger.warning("no io");
      return;
    }

    try {
      this.io?.emit(
        `fdmmonster`,
        JSON.stringify({
          event,
          printerId,
          data,
        })
      );
    } catch (e) {
      console.log("ERROR");
      this.#logger.error(e);
    }
  }

  pushUploadUpdate(event, data) {
    console.log("Updating printer", printerId, !!this.io);
    if (!this.io) return;

    this.io?.emit(`${events.UPLOAD}`, {
      event,
      data,
    });
  }
}

module.exports = {
  SocketIoGateway,
};
