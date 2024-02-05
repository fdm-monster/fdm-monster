import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { formatKB } from "@/utils/metric.utils";
import { printerEvents } from "@/constants/event.constants";
import { SettingsStore } from "@/state/settings.store";
import EventEmitter2 from "eventemitter2";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IdType } from "@/shared.constants";
import { LoggerService } from "@/handlers/logger";
import { OctoPrintEventDto, OctoPrintWsMessage } from "@/services/octoprint/dto/octoprint-event.dto";

export type PrinterEventsCacheDto = Record<OctoPrintWsMessage, any | null>;

export class PrinterEventsCache extends KeyDiffCache<PrinterEventsCacheDto> {
  private logger: LoggerService;
  private eventEmitter2: EventEmitter2;
  private settingsStore: SettingsStore;

  constructor({
    eventEmitter2,
    loggerFactory,
    settingsStore,
  }: {
    eventEmitter2: EventEmitter2;
    loggerFactory: ILoggerFactory;
    settingsStore: SettingsStore;
  }) {
    super();
    this.settingsStore = settingsStore;
    this.logger = loggerFactory(PrinterEventsCache.name);
    this.eventEmitter2 = eventEmitter2;

    this.subscribeToEvents();
  }

  private get _debugMode() {
    return this.settingsStore.getSettingsSensitive()?.server?.debugSettings?.debugSocketMessages;
  }

  async deletePrinterSocketEvents(id: IdType) {
    await this.deleteKeyValue(id, true);
  }

  async getPrinterSocketEvents(id: IdType) {
    return this.keyValueStore[id];
  }

  async getOrCreateEvents(printerId: IdType) {
    let ref = await this.getValue(printerId);
    if (!ref) {
      ref = {
        connected: null,
        reauthRequired: null,
        slicingProgress: null,
        current: null,
        history: null,
        timelapse: null,
        event: {},
        plugin: {},
      };
      await this.setKeyValue(printerId, ref);
    }
    return ref;
  }

  async setEvent(printerId: IdType, label: OctoPrintWsMessage, payload: any) {
    const ref = await this.getOrCreateEvents(printerId);
    ref[label] = {
      payload,
      receivedAt: Date.now(),
    };
    await this.setKeyValue(printerId, ref);
  }

  async setSubstate(printerId: IdType, label: OctoPrintWsMessage, substateName: string, payload: any) {
    const ref = await this.getOrCreateEvents(printerId);
    if (!ref[label]) {
      ref[label] = {};
    }
    ref[label][substateName] = {
      payload,
      receivedAt: Date.now(),
    };
    await this.setKeyValue(printerId, ref);
  }

  async handlePrintersDeleted({ printerIds }: { printerIds: IdType[] }) {
    await this.deleteKeysBatch(printerIds);
  }

  private subscribeToEvents() {
    this.eventEmitter2.on("octoprint.*", (e) => this.onPrinterSocketMessage(e));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
  }

  private async onPrinterSocketMessage(e: OctoPrintEventDto) {
    const printerId = e.printerId;
    if (e.event !== "plugin" && e.event !== "event") {
      await this.setEvent(printerId, e.event, e.event === "history" ? this.pruneHistoryPayload(e.payload) : e.payload);
      if (this._debugMode) {
        this.logger.log(`Message '${e.event}' received, size ${formatKB(e.payload)}`, e.printerId);
      }
    } else if (e.event === "plugin") {
      await this.setSubstate(printerId, "plugin", e.payload.plugin, e.payload);
    } else if (e.event === "event") {
      const eventType = e.payload.type;
      await this.setSubstate(printerId, "event", eventType, e.payload.payload);
      if (this._debugMode) {
        this.logger.log(`Event '${eventType}' received`, e.printerId);
      }
    } else {
      this.logger.log(`Message '${e.event}' received`, e.printerId);
    }
  }

  private pruneHistoryPayload(payload) {
    delete payload.logs;
    delete payload.temps;
    delete payload.messages;
    return payload;
  }
}
