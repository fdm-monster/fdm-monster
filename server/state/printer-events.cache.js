const { KeyDiffCache } = require("../utils/cache/key-diff.cache");
const { formatKB } = require("../utils/metric.utils");
const { printerEvents } = require("../constants/event.constants");
const { AppConstants } = require("../server.constants");

class PrinterEventsCache extends KeyDiffCache {
  /**
   * @type {LoggerService}
   */
  logger;
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;
  /**
   * @type {ConfigService}
   */
  configService;

  get _debugMode() {
    return this.configService.get(AppConstants.debugSocketMessagesKey, AppConstants.defaultDebugSocketMessages) === "true";
  }

  constructor({ eventEmitter2, loggerFactory, configService }) {
    super();
    this.configService = configService;
    this.logger = loggerFactory("PrinterEventsCache");
    this.eventEmitter2 = eventEmitter2;

    this.subscribeToEvents();
  }

  /**
   * @private
   */
  subscribeToEvents() {
    this.eventEmitter2.on("octoprint.*", (e) => this.onPrinterSocketMessage(e));
    this.eventEmitter2.on(printerEvents.printersDeleted, (e) => this.handlePrintersDeleted(e));
  }

  /**
   * @private
   * @param {OctoPrintEventDto} e
   */
  onPrinterSocketMessage(e) {
    const printerId = e.printerId;
    if (e.event !== "plugin" && e.event !== "event") {
      this.setEvent(printerId, e.event, null, e.event === "history" ? this.pruneHistoryPayload(e.payload) : e.payload);
      if (this._debugMode) {
        this.logger.log(`Message '${e.event}' received, size ${formatKB(e.payload)}`, e.printerId);
      }
    } else if (e.event === "plugin") {
      this.setSubEvent(printerId, "plugin", e.payload.plugin, e.payload);
    } else if (e.event === "event") {
      const eventType = e.payload.type;
      this.setSubEvent(printerId, "event", eventType, e.payload.payload);
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
  getPrinterSocketEvents(id) {
    return this.printerEventsById[id];
  }

  getOrCreateEvents(printerId) {
    let ref = this.printerEventsById[printerId];
    if (!ref) {
      this.printerEventsById[printerId] = { current: null, history: null, timelapse: null, event: {}, plugin: {} };
      ref = this.printerEventsById[printerId];
    }
    return ref;
  }

  setEvent(printerId, label, eventName, payload) {
    const ref = this.getOrCreateEvents(printerId);
    ref[label] = {
      payload,
      receivedAt: Date.now(),
    };
  }

  setSubEvent(printerId, label, eventName, payload) {
    const ref = this.getOrCreateEvents(printerId);
    ref[label][eventName] = {
      payload,
      receivedAt: Date.now(),
    };
  }

  async handlePrinterDeleted({ printerIds }) {
    await this.deleteKeysBatch(printerIds);
  }

  pruneHistoryPayload(payload) {
    delete payload.logs;
    delete payload.temps;
    delete payload.messages;
    return payload;
  }

  getId(value) {
    return "";
  }
}

module.exports = { PrinterEventsCache };
