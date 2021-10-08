const { stringify } = require("flatted");
const Logger = require("../handlers/logger");
const { AppConstants } = require("../app.constants");
const { byteCount } = require("../utils/benchmark.util");

class PrinterSseTask {
  #printerSseHandler;
  #printersStore;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger = new Logger("Printer-SSE-task");

  constructor({ printerSseHandler, printersStore }) {
    this.#printerSseHandler = printerSseHandler;
    this.#printersStore = printersStore;
  }

  async run() {
    const printerStates = this.#printersStore.listPrintersFlat();
    const testPrinterStates = this.#printersStore.listPrintersFlat(true);
    const sseData = {
      printers: printerStates,
      testPrinters: testPrinterStates
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
