const { IO_MESSAGES } = require("../state/socket-io.gateway");
const { socketIoConnectedEvent } = require("../constants/event.constants");
const { sizeKB, formatKB } = require("../utils/metric.utils");

export class SocketIoTask {
  /**
   * @type {SocketIoGateway}
   */
  socketIoGateway;
  /**
   * @type {PrinterSocketStore}
   */
  printerSocketStore;
  /**
   * @type {PrinterEventsCache}
   */
  printerEventsCache;
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
  /**
   * @type {LoggerService}
   */
  logger;
  /**
   * @type {SettingsStore}
   */
  settingsStore;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;

  constructor({
    socketIoGateway,
    floorStore,
    printerSocketStore,
    printerEventsCache,
    printerCache,
    loggerFactory,
    fileUploadTrackerCache,
    settingsStore,
    eventEmitter2,
  }) {
    this.socketIoGateway = socketIoGateway;
    this.printerSocketStore = printerSocketStore;
    this.printerEventsCache = printerEventsCache;
    this.fileUploadTrackerCache = fileUploadTrackerCache;
    this.floorStore = floorStore;
    this.logger = loggerFactory(SocketIoTask.name);
    this.eventEmitter2 = eventEmitter2;
    this.printerCache = printerCache;
    this.settingsStore = settingsStore;

    this.eventEmitter2.on(socketIoConnectedEvent, async () => {
      await this.sendUpdate();
    });
  }

  async run() {
    await this.sendUpdate();
  }

  async sendUpdate() {
    const floors = await this.floorStore.listCache();
    const printers = await this.printerCache.listCachedPrinters(true);
    const socketStates = this.printerSocketStore.getSocketStatesById();
    const printerEvents = await this.printerEventsCache.getAllKeyValues();
    const trackedUploads = this.fileUploadTrackerCache.getUploads(true);

    const socketIoData = {
      printers,
      floors,
      socketStates,
      printerEvents,
      trackedUploads,
    };

    // Precise debugging
    if (this.settingsStore.getServerSettings().debugSettings?.debugSocketIoBandwidth) {
      const kbDataString = Object.entries(socketIoData)
        .map(([id, state]) => {
          return `${id} ${formatKB(state)}`;
        })
        .join(" ");
      this.logger.log(kbDataString);
    }

    const serializedData = JSON.stringify(socketIoData);
    const transportDataSize = sizeKB(serializedData);
    this.updateAggregator(transportDataSize);
    this.socketIoGateway.send(IO_MESSAGES.LegacyUpdate, serializedData);
  }

  updateAggregator(transportDataLength) {
    if (this.#aggregateSizeCounter >= this.#aggregateWindowLength) {
      const summedPayloadSize = this.#aggregateSizes.reduce((t, n) => (t += n));
      const averagePayloadSize = summedPayloadSize / this.#aggregateWindowLength;
      this.logger.log(
        `Printer SocketIO metrics ${averagePayloadSize.toFixed(this.#rounding)}kB [${this.#aggregateWindowLength} TX avg].`
      );
      this.#aggregateSizeCounter = 0;
      this.#aggregateSizes = [];
    }

    this.#aggregateSizes.push(transportDataLength);
    ++this.#aggregateSizeCounter;
  }
}

module.exports = { SocketIoTask };
