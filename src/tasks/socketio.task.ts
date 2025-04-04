import { IO_MESSAGES, SocketIoGateway } from "@/state/socket-io.gateway";
import { socketIoConnectedEvent } from "@/constants/event.constants";
import { formatKB, sizeKB } from "@/utils/metric.utils";
import { SettingsStore } from "@/state/settings.store";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { PrinterEventsCache } from "@/state/printer-events.cache";
import { FloorStore } from "@/state/floor.store";
import { FileUploadTrackerCache } from "@/state/file-upload-tracker.cache";
import EventEmitter2 from "eventemitter2";
import { PrinterCache } from "@/state/printer.cache";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class SocketIoTask {
  logger: LoggerService;

  private aggregateSizeCounter = 0;
  private aggregateWindowLength = 100;
  private aggregateSizes: number[] = [];
  private rounding = 2;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly socketIoGateway: SocketIoGateway,
    private readonly floorStore: FloorStore,
    private readonly printerSocketStore: PrinterSocketStore,
    private readonly printerEventsCache: PrinterEventsCache,
    private readonly printerCache: PrinterCache,
    private readonly fileUploadTrackerCache: FileUploadTrackerCache,
    private readonly settingsStore: SettingsStore,
    private readonly eventEmitter2: EventEmitter2
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

    // Precise debugging
    if (this.settingsStore.getDebugSettingsSensitive()?.debugSocketIoBandwidth) {
      const kbDataString = Object.entries(socketIoData)
        .map(([id, state]) => {
          return `${id} ${formatKB(state)}`;
        })
        .join(" ");
      this.logger.log(kbDataString);
    }

    const serializedData = JSON.stringify(socketIoData);
    const transportDataSize = sizeKB(serializedData);
    this.updateAggregator(transportDataSize);
    this.socketIoGateway.send(IO_MESSAGES.LegacyUpdate, socketIoData);
  }

  updateAggregator(transportDataLength: number) {
    if (this.aggregateSizeCounter >= this.aggregateWindowLength) {
      const summedPayloadSize = this.aggregateSizes.reduce((t, n) => (t += n));
      const averagePayloadSize = summedPayloadSize / this.aggregateWindowLength;
      this.logger.log(
        `Printer SocketIO metrics ${averagePayloadSize.toFixed(this.rounding)}kB [${this.aggregateWindowLength} TX avg].`
      );
      this.aggregateSizeCounter = 0;
      this.aggregateSizes = [];
    }

    this.aggregateSizes.push(transportDataLength);
    ++this.aggregateSizeCounter;
  }
}
