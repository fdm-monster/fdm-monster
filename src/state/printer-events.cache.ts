import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { printerEvents, PrintersDeletedEvent } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { IdType } from "@/shared.constants";
import { OctoPrintEventDto, WsMessage } from "@/services/octoprint/dto/octoprint-event.dto";
import { HistoryMessageDto } from "@/services/octoprint/dto/websocket/history-message.dto";
import { MoonrakerEventDto, MR_WsMessage } from "@/services/moonraker/constants/moonraker-event.dto";
import { PrinterObjectsQueryDto } from "@/services/moonraker/dto/objects/printer-objects-query.dto";
import { SubscriptionType } from "@/services/moonraker/moonraker-websocket.adapter";

export type PrinterEventsCacheDto = Record<WsMessage, any | null>;

export class PrinterEventsCache extends KeyDiffCache<PrinterEventsCacheDto> {

  constructor(
    private readonly eventEmitter2: EventEmitter2
  ) {
    super();

    this.subscribeToEvents();
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
        // slicingProgress: null,
        notify_status_update: null,
        current: null,
        history: null,
        // timelapse: null,
        // event: {},
        // plugin: {},
        API_STATE_UPDATED: null,
        WS_CLOSED: null,
        WS_ERROR: null,
        WS_OPENED: null,
        WS_STATE_UPDATED: null
      };
      await this.setKeyValue(printerId, ref);
    }
    return ref;
  }

  async setEvent(printerId: IdType, label: WsMessage, payload: any) {
    const ref = await this.getOrCreateEvents(printerId);
    ref[label] = {
      payload,
      receivedAt: Date.now()
    };
    await this.setKeyValue(printerId, ref);
  }

  async setSubstate(printerId: IdType, label: WsMessage, substateName: string, payload: any) {
    const ref = await this.getOrCreateEvents(printerId);
    if (!ref[label]) {
      ref[label] = {};
    }
    ref[label][substateName] = {
      payload,
      receivedAt: Date.now()
    };
    await this.setKeyValue(printerId, ref);
  }

  private async handlePrintersDeleted(event: PrintersDeletedEvent) {
    await this.deleteKeysBatch(event.printerIds);
  }

  private subscribeToEvents() {
    this.eventEmitter2.on("octoprint.*", (e) => this.onOctoPrintSocketMessage(e));
    this.eventEmitter2.on("moonraker.*", (e) => this.onMoonrakerSocketMessage(e));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
  }

  private async onOctoPrintSocketMessage(e: OctoPrintEventDto) {
    const printerId = e.printerId;
    if (!["plugin", "event"].includes(e.event)) {
      await this.setEvent(printerId, e.event, e.event === "history" ? this.pruneHistoryPayload(e.payload) : e.payload);
    }
  }

  private async onMoonrakerSocketMessage(
    e: MoonrakerEventDto<MR_WsMessage, PrinterObjectsQueryDto<SubscriptionType | null>>
  ) {
    const printerId = e.printerId;
    const eventType = e.event;

    // https://github.com/mainsail-crew/mainsail/blob/fa61d4ef92 97426a404dd845a1a4d5e4525c43dc/src/components/panels/StatusPanel.vue#L199
    if (["notify_status_update", "current"].includes(eventType)) {
      await this.setEvent(printerId, eventType as "notify_status_update" | "current", e.payload);
    }
  }

  private pruneHistoryPayload(payload: HistoryMessageDto) {
    delete payload.logs;
    delete payload.temps;
    delete payload.messages;
    return payload;
  }
}
