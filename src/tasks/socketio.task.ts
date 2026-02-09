import { SocketIoGateway, IO_MESSAGES } from "@/state/socket-io.gateway";
import { socketIoConnectedEvent } from "@/constants/event.constants";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { PrinterEventsCache } from "@/state/printer-events.cache";
import { FloorStore } from "@/state/floor.store";
import { FileUploadTrackerCache } from "@/state/file-upload-tracker.cache";
import EventEmitter2 from "eventemitter2";
import { PrinterCache } from "@/state/printer.cache";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";

export class SocketIoTask {
  logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly socketIoGateway: SocketIoGateway,
    private readonly floorStore: FloorStore,
    private readonly printerSocketStore: PrinterSocketStore,
    private readonly printerEventsCache: PrinterEventsCache,
    private readonly printerCache: PrinterCache,
    private readonly fileUploadTrackerCache: FileUploadTrackerCache,
    private readonly eventEmitter2: EventEmitter2,
  ) {
    this.logger = loggerFactory(SocketIoTask.name);

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
    const trackedUploads = this.fileUploadTrackerCache.getUploads();

    const socketIoData = {
      printers,
      floors,
      socketStates,
      printerEvents,
      trackedUploads,
    };

    this.socketIoGateway.send(IO_MESSAGES.Update, socketIoData);
  }
}
