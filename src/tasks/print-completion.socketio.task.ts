import { octoPrintWebsocketEvent, fdmMonsterPrinterStoppedEvent } from "../constants/event.constants";
import { EVENT_TYPES } from "../services/octoprint/constants/octoprint-websocket.constants";
import { generateCorrelationToken } from "../utils/correlation-token.util";
import { IO_MESSAGES } from "../state/socket-io.gateway";

export class PrintCompletionSocketIoTask {
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;
  /**
   * @type {SocketIoGateway}
   */
  socketIoGateway;
  /**
   * @type {LoggerService}
   */
  logger;
  /**
   * @type {PrintCompletionService}
   */
  printCompletionService;

  contextCache = {};

  constructor({ eventEmitter2, socketIoGateway, printCompletionService, loggerFactory }) {
    this.eventEmitter2 = eventEmitter2;
    this.socketIoGateway = socketIoGateway;
    this.printCompletionService = printCompletionService;
    this.logger = loggerFactory(PrintCompletionSocketIoTask.name);

    let that = this;
    this.eventEmitter2.on(octoPrintWebsocketEvent("*"), async function (octoPrintEvent, data) {
      await that.handleMessage(this.event, octoPrintEvent, data);
    });
  }

  get contexts() {
    return this.contextCache;
  }

  async handleMessage(fdmEvent, octoPrintEvent, data) {
    // If not parsed well, skip log
    const printerId = fdmEvent.replace("octoprint.", "");
    if (!printerId) {
      this.logger.log(`Skipping print completion log for FDM event ${fdmEvent}`);
    }

    if (octoPrintEvent !== "event") {
      return;
    }

    const completion = {
      status: data.type,
      fileName: data.payload?.name,
      createdAt: Date.now(),
      completionLog: data.payload?.error,
      printerId: printerId,
    };

    this.socketIoGateway.send(IO_MESSAGES.CompletionEvent, JSON.stringify({ fdmEvent, octoPrintEvent, data }));

    if (
      data.type === EVENT_TYPES.EStop ||
      data.type === EVENT_TYPES.PrintCancelling ||
      data.type === EVENT_TYPES.PrintCancelled ||
      data.type === EVENT_TYPES.Home ||
      data.type === EVENT_TYPES.TransferStarted ||
      data.type === EVENT_TYPES.TransferDone ||
      data.type === EVENT_TYPES.Disconnecting ||
      data.type === EVENT_TYPES.Disconnected ||
      data.type === EVENT_TYPES.MetadataAnalysisStarted ||
      data.type === EVENT_TYPES.MetadataAnalysisFinished ||
      data.type === EVENT_TYPES.Error
    ) {
      this.contextCache[printerId] = {
        ...this.contextCache[printerId],
        [data.type]: completion,
      };

      const corrId = this.contextCache[printerId].correlationId;
      await this.printCompletionService.updateContext(corrId, this.contextCache[printerId]);
      return;
    }

    if (data.type === EVENT_TYPES.PrintStarted) {
      // Clear the context now with association id
      this.contextCache[printerId] = {
        correlationId: generateCorrelationToken(),
      };
      completion.context = this.contextCache[printerId];
      await this.printCompletionService.create(completion);
    } else if (data.type === EVENT_TYPES.PrintFailed || data.type === EVENT_TYPES.PrintDone) {
      completion.context = this.contextCache[printerId] || {};
      await this.printCompletionService.create(completion);

      this.eventEmitter2.emit(fdmMonsterPrinterStoppedEvent(printerId));

      // Clear the context now
      this.contextCache[printerId] = {};
    }
  }

  async run() {
    // Run once to bind event handler and reload the cache
    this.contextCache = await this.printCompletionService.loadPrintContexts();
  }
}
