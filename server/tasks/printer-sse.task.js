const { byteCount } = require("../utils/benchmark.util");

class PrinterSseTask {
  #printerSseHandler;
  #printerGroupsCache;
  #printersStore;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger;

  constructor({ printerSseHandler, printerGroupsCache, printersStore, loggerFactory }) {
    this.#printerSseHandler = printerSseHandler;
    this.#printersStore = printersStore;
    this.#printerGroupsCache = printerGroupsCache;
    this.#logger = loggerFactory("Printer-SSE-task");
  }

  async run() {
    const printerStates = this.#printersStore.listPrintersFlat();
    const printerGroups = this.#printerGroupsCache.getCache();

    const sseData = {
      printers: printerStates,
      printerGroups
    };

    const serializedData = JSON.stringify(sseData);
    const transportDataSize = byteCount(serializedData);
    this.updateAggregator(transportDataSize);
    this.#printerSseHandler.send(serializedData);
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
