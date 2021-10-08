const { stringify } = require("flatted");
const { AppConstants } = require("../app.constants");
const { byteCount } = require("../utils/benchmark.util");

class PrinterSseTask {
  #printerSseHandler;
  #printersStore;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger;

  constructor({ printerSseHandler, printersStore, loggerFactory }) {
    this.#printerSseHandler = printerSseHandler;
    this.#printersStore = printersStore;
    this.#logger = loggerFactory("Printer-SSE-task");
  }

  async run() {
    const printerStates = this.#printersStore.listPrintersFlat();
    const testPrinterState = this.#printersStore.getTestPrinterFlat();
    const sseData = {
      printers: printerStates,
      testPrinter: testPrinterState
    };

    const serializedData = AppConstants.jsonStringify
      ? JSON.stringify(sseData)
      : stringify(sseData);
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
