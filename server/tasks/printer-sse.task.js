const { byteCount } = require("../utils/benchmark.util");

class PrinterSseTask {
  #sseHandler;
  #printerGroupsCache;
  #printersStore;
  #printerFloorsCache;
  #fileUploadTrackerCache;
  #influxDbQueryTask;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger;

  constructor({
    sseHandler,
    printerGroupsCache,
    printerFloorsCache,
    printersStore,
    loggerFactory,
    fileUploadTrackerCache,
    influxDbQueryTask,
  }) {
    this.#sseHandler = sseHandler;
    this.#printersStore = printersStore;
    this.#printerGroupsCache = printerGroupsCache;
    this.#fileUploadTrackerCache = fileUploadTrackerCache;
    this.#printerFloorsCache = printerFloorsCache;
    this.#influxDbQueryTask = influxDbQueryTask;
    this.#logger = loggerFactory("Printer-SSE-task");
  }

  async run() {
    const floors = await this.#printerFloorsCache.listCache();
    const printerStates = this.#printersStore.listPrintersFlat();
    const printerGroups = this.#printerGroupsCache.getCache();
    const trackedUploads = this.#fileUploadTrackerCache.getUploads(true);

    const sseData = {
      printers: printerStates,
      floors,
      trackedUploads,
      printerGroups,
      outletCurrentValues: this.#influxDbQueryTask.lastOutletCurrentValues(),
    };

    const serializedData = JSON.stringify(sseData);
    const transportDataSize = byteCount(serializedData);
    this.updateAggregator(transportDataSize);
    this.#sseHandler.send(serializedData);
  }

  updateAggregator(transportDataLength) {
    if (this.#aggregateSizeCounter >= this.#aggregateWindowLength) {
      const summedPayloadSize = this.#aggregateSizes.reduce((t, n) => (t += n));
      const averagePayloadSize = summedPayloadSize / 1000 / this.#aggregateWindowLength;
      this.#logger.info(
        `Printer SSE metrics ${averagePayloadSize.toFixed(this.#rounding)} kB [${
          this.#aggregateWindowLength
        } TX avg].`
      );
      this.#aggregateSizeCounter = 0;
      this.#aggregateSizes = [];
    }

    this.#aggregateSizes.push(transportDataLength);
    ++this.#aggregateSizeCounter;
  }
}

module.exports = PrinterSseTask;
