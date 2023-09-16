const { KeyDiffCache } = require("../utils/cache/key-diff.cache");
const { formatKB } = require("../utils/metric.utils");
const { printerEvents } = require("../constants/event.constants");

export class PrinterEventsCache extends KeyDiffCache {
  /**
   * @type {LoggerService}
   */
  logger;
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;
  /**
   * @type {SettingsStore}
   */
  settingsStore;

  get _debugMode() {
    return this.settingsStore.getServerSettings().debugSettings?.debugSocketMessages;
  }

  constructor({ eventEmitter2, loggerFactory, settingsStore }) {
    super();
    this.settingsStore = settingsStore;
    this.logger = loggerFactory("PrinterEventsCache");
    this.eventEmitter2 = eventEmitter2;

    this.subscribeToEvents();
  }

  /**
   * @private
   */
  subscribeToEvents() {
    this.eventEmitter2.on("octoprint.*", (e) => this.onPrinterSocketMessage(e));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
  }

  /**
   * @private
   * @param {OctoPrintEventDto} e
   */
  async onPrinterSocketMessage(e) {
    const printerId = e.printerId;
    if (e.event !== "plugin" && e.event !== "event") {
      await this.setEvent(printerId, e.event, null, e.event === "history" ? this.pruneHistoryPayload(e.payload) : e.payload);
      if (this._debugMode) {
        this.logger.log(`Message '${e.event}' received, size ${formatKB(e.payload)}`, e.printerId);
      }
    } else if (e.event === "plugin") {
      await this.setSubEvent(printerId, "plugin", e.payload.plugin, e.payload);
    } else if (e.event === "event") {
      const eventType = e.payload.type;
      await this.setSubEvent(printerId, "event", eventType, e.payload.payload);
      if (this._debugMode) {
        this.logger.log(`Event '${eventType}' received`, e.printerId);
      }
    } else {
      this.logger.log(`Message '${e.event}' received`, e.printerId);
    }
  }

  /**
   * @param {string} id
   * @returns {*}
   */
  async getPrinterSocketEvents(id) {
    return this.keyValueStore[id];
  }

  async getOrCreateEvents(printerId) {
    let ref = await this.getValue(printerId);
    if (!ref) {
      ref = { current: null, history: null, timelapse: null, event: {}, plugin: {} };
      await this.setKeyValue(printerId, ref);
    }
    return ref;
  }

  async setEvent(printerId, label, eventName, payload) {
    const ref = await this.getOrCreateEvents(printerId);
    ref[label] = {
      payload,
      receivedAt: Date.now(),
    };
    await this.setKeyValue(printerId, ref);
  }

  async setSubEvent(printerId, label, eventName, payload) {
    const ref = await this.getOrCreateEvents(printerId);
    ref[label][eventName] = {
      payload,
      receivedAt: Date.now(),
    };
    await this.setKeyValue(printerId, ref);
  }

  async handlePrintersDeleted({ printerIds }) {
    await this.deleteKeysBatch(printerIds);
  }

  /** @private **/
  pruneHistoryPayload(payload) {
    delete payload.logs;
    delete payload.temps;
    delete payload.messages;
    return payload;
  }
}

module.exports = { PrinterEventsCache };
