const { octoPrintWebsocketEvent } = require("../constants/event.constants");
const { EVENT_TYPES } = require("../services/octoprint/constants/octoprint-websocket.constants");
const { generateCorrelationToken } = require("../utils/correlation-token.util");

class PrintEventsSseTask {
  #eventEmitter2;
  #sseHandler;
  #logger;

  #printCompletionService;

  #contextCache = {};

  constructor({ eventEmitter2, sseHandler, printCompletionService, loggerFactory }) {
    this.#eventEmitter2 = eventEmitter2;
    this.#sseHandler = sseHandler;
    this.#printCompletionService = printCompletionService;
    this.#logger = loggerFactory(PrintEventsSseTask.name);

    let that = this;
    this.#eventEmitter2.on(octoPrintWebsocketEvent("*"), async function (data1, data2) {
      await that.handleMessage(this.event, data1, data2);
    });
  }

  async handleMessage(fdmEvent, octoPrintEvent, data) {
    this.#sseHandler.send(JSON.stringify({ fdmEvent, octoPrintEvent, data }), "octoprint-events");

    // If not parsed well, skip log
    const printerId = fdmEvent.replace("octoprint.", "");
    if (!printerId) {
      this.#logger.info(`Skipping print completion log for FDM event ${fdmEvent}`);
    }

    if (octoPrintEvent !== "event") {
      return;
    }

    const completion = {
      status: data.type,
      fileName: data.payload?.name,
      completionLog: data.payload?.error,
      printerId: printerId,
    };

    if (
      data.type === EVENT_TYPES.EStop ||
      data.type === EVENT_TYPES.PrintCancelling ||
      data.type === EVENT_TYPES.Error
    ) {
      this.#contextCache[printerId] = {
        [data.type]: completion,
      };
      return;
    }

    if (data.type === EVENT_TYPES.PrintStarted) {
      // Clear the context now with association id
      this.#contextCache[printerId] = {
        correlationId: generateCorrelationToken(),
      };
      await this.#printCompletionService.create(completion);
    } else if (
      data.type === EVENT_TYPES.PrintCancelled ||
      data.type === EVENT_TYPES.PrintFailed ||
      data.type === EVENT_TYPES.PrintDone
    ) {
      completion.cache = this.#contextCache[printerId] || {};
      await this.#printCompletionService.create(completion);
      // Clear the context now
      this.#contextCache[printerId] = {};
    }
  }

  async run() {
    // Run once to bind event handler
  }
}

module.exports = {
  PrintEventsSseTask,
};
