import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { printerEvents, PrintersDeletedEvent } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { IdType } from "@/shared.constants";
import { OctoPrintEventDto, WsMessage } from "@/services/octoprint/dto/octoprint-event.dto";
import {
  HistoryMessageDto,
  HistoryMessageDtoWithoutLogsMessagesPluginsAndTemps,
} from "@/services/octoprint/dto/websocket/history-message.dto";
import { MoonrakerEventDto, MR_WsMessage } from "@/services/moonraker/constants/moonraker-event.dto";
import { PrinterObjectsQueryDto } from "@/services/moonraker/dto/objects/printer-objects-query.dto";
import { SubscriptionType } from "@/services/moonraker/moonraker-websocket.adapter";
import { octoPrintEvent } from "@/services/octoprint/octoprint-websocket.adapter";
import { moonrakerEvent } from "@/services/moonraker/constants/moonraker.constants";
import { prusaLinkEvent } from "@/services/prusa-link/constants/prusalink.constants";
import { PrusaLinkEventDto } from "@/services/prusa-link/constants/prusalink-event.dto";
import { bambuEvent, BambuEventDto } from "@/services/bambu/bambu-mqtt.adapter";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";

export type WsMessageWithoutEventAndPlugin = Exclude<WsMessage, "event" | "plugin">;
export type PrinterEventsCacheDto = Record<WsMessageWithoutEventAndPlugin, any>;

export class PrinterEventsCache extends KeyDiffCache<PrinterEventsCacheDto> {
  private readonly logger: LoggerService;

  constructor(
    private readonly eventEmitter2: EventEmitter2,
    loggerFactory: ILoggerFactory) {
    super();

    this.logger = loggerFactory(PrinterEventsCache.name);
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
        WS_STATE_UPDATED: null,
      };
      await this.setKeyValue(printerId, ref);
    }
    return ref;
  }

  async setEvent(printerId: IdType, label: WsMessageWithoutEventAndPlugin, payload: any) {
    const ref = await this.getOrCreateEvents(printerId);
    ref[label] = {
      payload,
      receivedAt: Date.now(),
    };
    await this.setKeyValue(printerId, ref);
  }

  async setSubState(printerId: IdType, label: WsMessageWithoutEventAndPlugin, substateName: string, payload: any) {
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

  private async handlePrintersDeleted(event: PrintersDeletedEvent) {
    await this.deleteKeysBatch(event.printerIds);
  }

  private subscribeToEvents() {
    this.eventEmitter2.on(octoPrintEvent("*"), (e) => this.onOctoPrintSocketMessage(e));
    this.eventEmitter2.on(moonrakerEvent("*"), (e) => this.onMoonrakerSocketMessage(e));
    this.eventEmitter2.on(prusaLinkEvent("*"), (e) => this.onPrusaLinkPollMessage(e));
    this.eventEmitter2.on(bambuEvent("*"), (e) => this.onBambuSocketMessage(e));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
  }

  private async onOctoPrintSocketMessage(e: OctoPrintEventDto) {
    const printerId = e.printerId;
    if (!["plugin", "event"].includes(e.event)) {
      await this.setEvent(
        printerId,
        e.event as WsMessageWithoutEventAndPlugin,
        e.event === "history" ? this.pruneHistoryPayload(e.payload) : e.payload,
      );
    }
  }

  private async onMoonrakerSocketMessage(
    e: MoonrakerEventDto<MR_WsMessage, PrinterObjectsQueryDto<SubscriptionType | null>>,
  ) {
    const printerId = e.printerId;
    const eventType = e.event;

    // https://github.com/mainsail-crew/mainsail/blob/fa61d4ef92 97426a404dd845a1a4d5e4525c43dc/src/components/panels/StatusPanel.vue#L199
    if (["notify_status_update", "current"].includes(eventType)) {
      await this.setEvent(printerId, eventType as "notify_status_update" | "current", e.payload);
    }
  }

  private async onPrusaLinkPollMessage(
    e: PrusaLinkEventDto) {
    const printerId = e.printerId;

    this.logger.debug(`Received prusaLink event ${e.event}, printerId ${e.printerId}`, e);
    if (e.event === "current") {
      await this.setEvent(printerId, e.event, e.payload);
    }
  }

  private async onBambuSocketMessage(e: BambuEventDto) {
    const printerId = e.printerId;
    if (!printerId) {
      this.logger.warn("Received Bambu event without printerId", e);
      return;
    }

    this.logger.debug(`Received Bambu event ${e.event}, printerId ${printerId}`);
    if (e.event === "current") {
      await this.setEvent(printerId, e.event, e.payload);
    }
  }

  private pruneHistoryPayload(payload: HistoryMessageDto): HistoryMessageDtoWithoutLogsMessagesPluginsAndTemps {
    const { logs, temps, messages, plugins, ...prunedPayload } = payload;
    return prunedPayload satisfies HistoryMessageDtoWithoutLogsMessagesPluginsAndTemps;
  }
}
