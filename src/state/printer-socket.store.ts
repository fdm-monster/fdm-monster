import { captureException } from "@sentry/node";
import { errorSummary } from "@/utils/error.utils";
import {
  BatchPrinterCreatedEvent,
  PrinterCreatedEvent,
  printerEvents,
  PrintersDeletedEvent,
  PrinterUpdatedEvent,
} from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { SocketFactory } from "@/services/socket.factory";
import { PrinterCache } from "@/state/printer.cache";
import { OctoprintWebsocketAdapter } from "@/services/octoprint/octoprint-websocket.adapter";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IdType } from "@/shared.constants";
import { OctoprintType } from "@/services/printer-api.interface";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { PrinterDto } from "@/services/interfaces/printer.dto";
import { SocketState } from "@/shared/dtos/socket-state.type";
import { ApiState } from "@/shared/dtos/api-state.type";

export interface PrinterSocketState {
  printerId: IdType,
  printerType: number,
  socket: SocketState,
  api: ApiState,
}

export class PrinterSocketStore {
  printerSocketAdaptersById: Record<IdType, IWebsocketAdapter> = {};
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly socketFactory: SocketFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly printerCache: PrinterCache,
  ) {
    this.logger = loggerFactory(PrinterSocketStore.name);

    this.subscribeToEvents();
  }

  getSocketStatesById() {
    const socketStatesById: { [k: IdType]: PrinterSocketState } = {};
    Object.values(this.printerSocketAdaptersById).forEach((s) => {
      if (!s.printerId) {
        return;
      }

      socketStatesById[s.printerId] = {
        printerId: s.printerId,
        printerType: s.printerType,
        socket: s.socketState,
        api: s.apiState,
      };
    });
    return socketStatesById;
  }

  async loadPrinterSockets() {
    await this.printerCache.loadCache();

    const printerDtoList = await this.printerCache.listCachedPrinters(false);
    this.printerSocketAdaptersById = {};
    for (const printerDto of printerDtoList) {
      try {
        this.handlePrinterCreated({ printer: printerDto });
      } catch (e) {
        captureException(e);
        this.logger.error("PrinterSocketStore failed to construct new socket.", errorSummary(e));
      }
    }

    this.logger.log(`Loaded ${Object.keys(this.printerSocketAdaptersById).length} printer sockets`);
  }

  listPrinterSockets() {
    return Object.values(this.printerSocketAdaptersById);
  }

  reconnectPrinterAdapter(id: IdType) {
    const socket = this.getPrinterSocket(id);
    if (!socket) return;

    socket.close();

    // The reconnect task will pick up this state and reconnect
    socket.resetSocketState();
  }

  getPrinterSocket(id: IdType): IWebsocketAdapter | undefined {
    return this.printerSocketAdaptersById[id];
  }

  /**
   * Sets up the new WebSocket connections for all printers
   */
  async reconnectPrinterSockets(): Promise<void> {
    let reauthRequested = 0;
    let socketSetupRequested = 0;
    const socketStates: { [k: string]: number } = {};
    const apiStates: { [k: string]: number } = {};
    const promisesReauth = [];
    for (const socket of Object.values(this.printerSocketAdaptersById)) {
      try {
        if (socket.printerType === OctoprintType && (socket as OctoprintWebsocketAdapter).needsReauth()) {
          reauthRequested++;
          // TODO OP close socket
          const promise = socket.reauthSession().catch();
          // TODO MR reconnect
          promisesReauth.push(promise);
        }
      } catch (e) {
        captureException(e);
      }
    }

    await Promise.all(promisesReauth);

    const promisesOpenSocket: any[] = [];
    for (const socket of Object.values(this.printerSocketAdaptersById)) {
      try {
        if (socket.needsSetup() || socket.needsReopen()) {
          socketSetupRequested++;
          const promise = socket
            .setupSocketSession()
            .then(() => {
              socket.open();
            })
            .catch();
          promisesOpenSocket.push(promise);
        }
      } catch (e) {
        captureException(e);
      }

      const keySocket = socket.socketState;
      const valSocket = socketStates[keySocket];
      socketStates[keySocket] = valSocket ? valSocket + 1 : 1;
      const keyApi = socket.apiState;
      const valApi = apiStates[keyApi];
      apiStates[keyApi] = valApi ? valApi + 1 : 1;
    }

    await Promise.all(promisesOpenSocket);
  }

  createOrUpdateSocket(printer: PrinterDto<IdType>) {
    const { enabled, id } = printer;
    let foundAdapter = this.printerSocketAdaptersById[id.toString()];

    // Delete the socket if the printer is disabled
    if (!enabled) {
      this.logger.log(`Printer is disabled. Deleting socket`);
      this.deleteSocket(id);
      return;
    }

    // Create a new socket if it doesn't exist
    if (!foundAdapter) {
      foundAdapter = this.socketFactory.createInstance(printer.printerType);
      this.printerSocketAdaptersById[id] = foundAdapter;
    } else {
      foundAdapter.close();
      this.logger.log(`Closing printer socket for update`);
    }

    // Reset the socket credentials before (re-)connecting
    foundAdapter.registerCredentials({
      printerId: printer.id.toString(),
      loginDto: {
        apiKey: printer.apiKey,
        username: printer.username,
        password: printer.password,
        printerURL: printer.printerURL,
        printerType: printer.printerType,
      },
    });
    foundAdapter.resetSocketState();
  }

  private handleBatchPrinterCreated(event: BatchPrinterCreatedEvent) {
    for (const printer of event.printers) {
      this.handlePrinterCreated({ printer });
    }
  }

  private handlePrinterCreated(event: PrinterCreatedEvent) {
    this.createOrUpdateSocket(event.printer);
  }

  private handlePrinterUpdated(event: PrinterUpdatedEvent) {
    this.logger.log(`Printer updated. Updating socket`);
    this.createOrUpdateSocket(event.printer);
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
    const socket = this.printerSocketAdaptersById[printerId];

    // Ensure that the printer does not re-register itself after being purged
    socket?.disallowEmittingEvents();

    socket?.close();

    // TODO mark diff cache
    delete this.printerSocketAdaptersById[printerId];
  }
}
