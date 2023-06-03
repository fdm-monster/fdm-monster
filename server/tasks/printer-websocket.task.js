class PrinterWebsocketTask {
  /**
   * @type {PrinterSocketStore}
   */
  printerSocketStore;
  /**
   * @type {SettingsStore}
   */
  settingsStore;
  /**
   * @type {OctoPrintApiService}
   */
  #octoPrintService;
  /**
   * @type {TaskManagerService}
   */
  #taskManagerService;

  /**
   * @type {LoggerService}
   */
  logger;

  constructor({ printerSocketStore, octoPrintApiService, settingsStore, taskManagerService, loggerFactory }) {
    this.printerSocketStore = printerSocketStore;
    this.settingsStore = settingsStore;
    this.#octoPrintService = octoPrintApiService;
    this.#taskManagerService = taskManagerService;
    this.logger = loggerFactory("Printer-Websocket-Task");
  }

  async run() {
    const startTime = Date.now();
    const result = await this.printerSocketStore.reconnectPrinterSockets();
    if (this.settingsStore.getServerSettings().debugSettings?.debugSocketReconnect) {
      this.logger.log(`Socket reconnect (${Date.now() - startTime}ms)`, result);
    }
  }
}

module.exports = PrinterWebsocketTask;
