import { captureException } from "@sentry/node";
import { errorSummary } from "@/utils/error.utils";
import { BatchPrinterCreatedEvent, PrinterCreatedEvent, printerEvents, PrintersDeletedEvent, PrinterUpdatedEvent } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { PrinterAdapterFactory } from "@/services/printer-adapter.factory";
import { PrinterCache } from "@/state/printer.cache";
import { LoggerService } from "@/handlers/logger";
import { ConfigService } from "@/services/core/config.service";
import { SettingsStore } from "@/state/settings.store";
import { SocketIoGateway } from "@/state/socket-io.gateway";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IdType } from "@/shared.constants";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { SocketState } from "@/shared/dtos/socket-state.type";
import { ApiState } from "@/shared/dtos/api-state.type";
import { PrinterDto } from "@/services/interfaces/printer.dto";

export interface PrinterSocketState {
  printerId: IdType,
  printerType: number,
  socket: SocketState,
  api: ApiState,
}

export class PrinterAdapterStore {
  printerAdaptersById: Record<string, IWebsocketAdapter> = {};
  logger: LoggerService;
  configService: ConfigService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerAdapterFactory: PrinterAdapterFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly printerCache: PrinterCache,
  ) {
    this.logger = loggerFactory(PrinterAdapterStore.name);

    this.subscribeToEvents();
  }

  async initPrinterSockets() {
    await this.printerCache.loadCache();

    const printers = await this.printerCache.listCachedPrinters(false);

    this.printerAdaptersById = {};
    for (const printer of printers) {
      try {
        await this.createOrUpdateAdapter(printer);
      } catch (e) {
        captureException(e);
        this.logger.error(`${PrinterAdapterStore.name} failed to construct new printer adapter.`, errorSummary(e));
      }
    }

    this.logger.log(`Loaded ${Object.keys(this.printerAdaptersById).length} printer adapters`);
  }

  async reconnectAdapter(id: IdType) {
    const adapter = this.getPrinterAdapter(id);

    if (!adapter) return;

    await adapter.reconnect();
  }

  getAdapterStatesById() {
    const adapterStatesById = {};
    Object.values(this.printerAdaptersById).forEach((s) => {
      adapterStatesById[s.printerId] = {
        printerId: s.printerId,
        printerType: s.printerType,
        socket: s.socketState,
        api: s.apiState,
      };
    });
    return adapterStatesById;
  }

  adapterAllowEmittingEvents(id: IdType, enabled: boolean) {
    const socket = this.getPrinterAdapter(id);
    if (!socket) return;

    if (enabled) {
      socket.allowEmittingEvents();
    } else {
      socket.disallowEmittingEvents();
    }
  }

  getPrinterAdapter(id: IdType): IWebsocketAdapter | undefined {
    return this.printerAdaptersById[id];
  }

  async createOrUpdateAdapter(printer: PrinterDto<IdType>): Promise<void> {
    const { enabled, id } = printer;
    let foundAdapter = this.printerAdaptersById[id.toString()];

    if (!enabled) {
      this.logger.log(`Printer is disabled. Deleting socket`);
      this.deleteSocket(id);
      return;
    }

    if (!foundAdapter) {
      foundAdapter = this.printerAdapterFactory.createInstance(printer.printerType);
      this.printerAdaptersById[id] = foundAdapter;
    }

    await foundAdapter.connect(printer.id.toString(), {
      apiKey: printer.apiKey,
      printerURL: printer.printerURL,
      printerType: printer.printerType,
    });
    foundAdapter.resetSocketState();
  }

  private handleBatchPrinterCreated(event: BatchPrinterCreatedEvent) {
    for (const printer of event.printers) {
      this.handlePrinterCreated({ printer });
    }
  }

  private handlePrinterCreated(event: PrinterCreatedEvent) {
    this.createOrUpdateAdapter(event.printer);
  }

  private handlePrinterUpdated(event: PrinterUpdatedEvent) {
    this.logger.log(`Printer updated. Updating socket`);
    this.createOrUpdateAdapter(event.printer);
  }

  private handlePrintersDeleted(event: PrintersDeletedEvent) {
    event.printerIds.forEach((id) => {
      this.deleteSocket(id);
    });
  }

  private subscribeToEvents() {
    this.eventEmitter2.on(printerEvents.printerCreated, this.handlePrinterCreated.bind(this));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
    this.eventEmitter2.on(printerEvents.printerUpdated, this.handlePrinterUpdated.bind(this));
    this.eventEmitter2.on(printerEvents.batchPrinterCreated, this.handleBatchPrinterCreated.bind(this));
  }

  private deleteSocket(printerId: IdType) {
    const socket = this.printerAdaptersById[printerId];

    socket?.disallowEmittingEvents();

    socket?.close();

    delete this.printerAdaptersById[printerId];
  }
}
