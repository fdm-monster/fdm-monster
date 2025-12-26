import { fdmMonsterPrinterStoppedEvent } from "@/constants/event.constants";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";
import { generateCorrelationToken } from "@/utils/correlation-token.util";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { CreatePrintCompletionDto, PrintCompletionContext } from "@/services/interfaces/print-completion.dto";
import { OctoPrintEventDto } from "@/services/octoprint/dto/octoprint-event.dto";
import { PrinterEventsCache } from "@/state/printer-events.cache";
import { IPrintCompletionService } from "@/services/interfaces/print-completion.interface";
import { octoPrintWebsocketEvent } from "@/services/octoprint/octoprint-websocket.adapter";

export class PrintCompletionSocketIoTask {
  contextCache: Record<number, PrintCompletionContext> = {};
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly printCompletionService: IPrintCompletionService,
    private readonly printerEventsCache: PrinterEventsCache,
  ) {
    this.logger = loggerFactory(PrintCompletionSocketIoTask.name);

    this.eventEmitter2.on(octoPrintWebsocketEvent("*"), async (octoPrintEvent: OctoPrintEventDto) => {
      await this.handleMessage(octoPrintEvent);
    });
  }

  get contexts() {
    return this.contextCache;
  }

  async handleMessage(event: OctoPrintEventDto) {
    const printerId = event.printerId;
    if (!printerId) {
      this.logger.log(`Skipping print completion log as PrinterId is unset`);
      return;
    }

    if (event.event !== "event") {
      return;
    }

    const completion = {
      status: event.payload.type,
      fileName: event.payload?.payload?.name,
      createdAt: Date.now(),
      completionLog: event.payload?.error,
      printerId,
      context: {
        correlationId: null,
      },
    } as CreatePrintCompletionDto;
    if (
      event.payload.type === EVENT_TYPES.EStop ||
      event.payload.type === EVENT_TYPES.PrintCancelling ||
      event.payload.type === EVENT_TYPES.PrintCancelled ||
      event.payload.type === EVENT_TYPES.Home ||
      event.payload.type === EVENT_TYPES.TransferStarted ||
      event.payload.type === EVENT_TYPES.TransferDone ||
      event.payload.type === EVENT_TYPES.Disconnecting ||
      event.payload.type === EVENT_TYPES.Disconnected ||
      event.payload.type === EVENT_TYPES.MetadataAnalysisStarted ||
      event.payload.type === EVENT_TYPES.MetadataAnalysisFinished ||
      event.payload.type === EVENT_TYPES.Error
    ) {
      this.contextCache[printerId] = {
        ...this.contextCache[printerId],
        [event.payload.type]: completion,
      };

      if (event.payload.type === EVENT_TYPES.Disconnecting || event.payload.type === EVENT_TYPES.Disconnected) {
        await this.printerEventsCache.setSubState(printerId, "current", "state", {
          text: event.payload.type,
          flags: {
            operational: false,
            printing: false,
            ready: false,
            closedOrError: true,
            error: false,
          },
        });
      }

      const corrId = this.contextCache[printerId].correlationId;
      await this.printCompletionService.updateContext(corrId, this.contextCache[printerId]);
      return;
    }

    if (event.payload.type === EVENT_TYPES.PrintStarted) {
      // Clear the context now with association id
      const token = generateCorrelationToken();
      this.contextCache[printerId] = {
        correlationId: token,
      };
      completion.context = this.contextCache[printerId];
      await this.printCompletionService.create(completion);
    } else if (event.payload.type === EVENT_TYPES.PrintFailed || event.payload.type === EVENT_TYPES.PrintDone) {
      // TODO fix runtime memory dependency
      completion.context = this.contextCache[printerId];
      await this.printCompletionService.create(completion);

      this.eventEmitter2.emit(fdmMonsterPrinterStoppedEvent(printerId));

      // Clear the context now
      this.contextCache[printerId] = {
        correlationId: undefined,
      };
    }
  }
}
