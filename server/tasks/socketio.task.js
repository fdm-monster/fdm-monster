const { byteCount } = require("../utils/benchmark.util");
const { IO_MESSAGES } = require("../state/socket-io.gateway");
const { socketIoConnectedEvent } = require("../constants/event.constants");

class SocketIoTask {
  /**
   * @type {SocketIoGateway}
   */
  socketIoGateway;
  /**
   * @type {PrinterSocketStore}
   */
  printerSocketStore;
  /**
   * @type {FloorStore}
   */
  floorStore;
  /**
   * @type {FileUploadTrackerCache}
   */
  fileUploadTrackerCache;
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;
  /**
   * @type {PrinterCache}
   */
  printerCache;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger;

  constructor({
    socketIoGateway,
    floorStore,
    printerSocketStore,
    printerCache,
    loggerFactory,
    fileUploadTrackerCache,
    eventEmitter2,
  }) {
    this.socketIoGateway = socketIoGateway;
    this.printerSocketStore = printerSocketStore;
    this.fileUploadTrackerCache = fileUploadTrackerCache;
    this.floorStore = floorStore;
    this.#logger = loggerFactory(SocketIoTask.name);
    this.eventEmitter2 = eventEmitter2;
    this.printerCache = printerCache;

    this.eventEmitter2.on(socketIoConnectedEvent, async () => {
      await this.sendUpdate();
    });
  }

  async run() {
    await this.sendUpdate();
  }

  async sendUpdate() {
    const floors = await this.floorStore.listCache();
    const printers = this.printerCache.listCachedPrinters(true);
    const socketStates = this.printerSocketStore.getSocketStatesById();
    const printerEvents = this.printerSocketStore.printerEventsById;
    const trackedUploads = this.fileUploadTrackerCache.getUploads(true);

    // TODO use diff cache
    const diffs = this.printerCache.processStateDiffs();

    const socketIoData = {
      printers,
      socketStates,
      printerEvents,
      floors,
      trackedUploads,
    };

    const serializedData = JSON.stringify(socketIoData);
    const transportDataSize = byteCount(serializedData);
    this.updateAggregator(transportDataSize);
    this.socketIoGateway.send(IO_MESSAGES.LegacyUpdate, serializedData);
  }

  updateAggregator(transportDataLength) {
    if (this.#aggregateSizeCounter >= this.#aggregateWindowLength) {
      const summedPayloadSize = this.#aggregateSizes.reduce((t, n) => (t += n));
      const averagePayloadSize = summedPayloadSize / 1000 / this.#aggregateWindowLength;
      this.#logger.log(
        `Printer SocketIO metrics ${averagePayloadSize.toFixed(this.#rounding)} kB [${this.#aggregateWindowLength} TX avg].`
      );
      this.#aggregateSizeCounter = 0;
      this.#aggregateSizes = [];
    }

    this.#aggregateSizes.push(transportDataLength);
    ++this.#aggregateSizeCounter;
  }
}

module.exports = { SocketIoTask };
