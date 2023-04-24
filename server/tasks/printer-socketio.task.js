const { byteCount } = require("../utils/benchmark.util");
const { IO_MESSAGES } = require("../state/socket-io.gateway");
const { socketIoConnectedEvent } = require("../constants/event.constants");

class PrinterSocketIoTask {
  #socketIoGateway;
  #printersStore;
  floorCache;
  #fileUploadTrackerCache;
  #influxDbQueryTask;
  #eventEmitter2;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger;

  constructor({
    socketIoGateway,
    floorCache,
    printersStore,
    loggerFactory,
    fileUploadTrackerCache,
    eventEmitter2,
  }) {
    this.#socketIoGateway = socketIoGateway;
    this.#printersStore = printersStore;
    this.#fileUploadTrackerCache = fileUploadTrackerCache;
    this.floorCache = floorCache;
    this.#logger = loggerFactory(PrinterSocketIoTask.name);
    this.#eventEmitter2 = eventEmitter2;

    this.#eventEmitter2.on(socketIoConnectedEvent, async () => {
      await this.sendUpdate();
    });
  }

  async run() {
    await this.sendUpdate();
  }

  async sendUpdate() {
    const floors = await this.floorCache.listCache();
    const printerStates = this.#printersStore.listPrintersFlat();
    const trackedUploads = this.#fileUploadTrackerCache.getUploads(true);

    const socketIoData = {
      printers: printerStates,
      floors,
      trackedUploads,
    };

    const serializedData = JSON.stringify(socketIoData);
    const transportDataSize = byteCount(serializedData);
    this.updateAggregator(transportDataSize);
    this.#socketIoGateway.send(IO_MESSAGES.LegacyUpdate, serializedData);
  }

  updateAggregator(transportDataLength) {
    if (this.#aggregateSizeCounter >= this.#aggregateWindowLength) {
      const summedPayloadSize = this.#aggregateSizes.reduce((t, n) => (t += n));
      const averagePayloadSize = summedPayloadSize / 1000 / this.#aggregateWindowLength;
      this.#logger.info(
        `Printer SocketIO metrics ${averagePayloadSize.toFixed(this.#rounding)} kB [${this.#aggregateWindowLength} TX avg].`
      );
      this.#aggregateSizeCounter = 0;
      this.#aggregateSizes = [];
    }

    this.#aggregateSizes.push(transportDataLength);
    ++this.#aggregateSizeCounter;
  }
}

module.exports = PrinterSocketIoTask;
