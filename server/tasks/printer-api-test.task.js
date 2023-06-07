const { errorSummary } = require("../utils/error.utils");

class PrinterApiTestTask {
  /**
   * @type {SettingsStore}
   */
  settingsStore;
  /**
   * @type {PrinterSocketStore}
   */
  printerSocketStore;
  /**
   * @type {OctoPrintApiService}
   */
  octoPrintApiService;
  /**
   * @type {TaskManagerService}
   */
  taskManagerService;
  /**
   * @type {LoggerService}
   */
  logger;

  constructor({ printerSocketStore, octoPrintApiService, settingsStore, taskManagerService, loggerFactory }) {
    this.printerSocketStore = printerSocketStore;
    this.settingsStore = settingsStore;
    this.octoPrintApiService = octoPrintApiService;
    this.taskManagerService = taskManagerService;
    this.logger = loggerFactory("Printer-Websocket-Ping-Task");
  }

  async run() {
    const startTime = Date.now();

    /**
     * @type {OctoPrintSockIoAdapter[]}
     */
    const existingSockets = this.printerSocketStore.listPrinterSockets();
    for (const socket of existingSockets) {
      try {
        if (socket.isClosedOrAborted()) {
          socket.close();
          socket.resetSocketState();
        } else if (!socket.lastMessageReceivedTimestamp || Date.now() - socket.lastMessageReceivedTimestamp > 10 * 1000) {
          socket.close();
          socket.resetSocketState();
        }
      } catch (e) {
        this.logger.error(
          `WebSocket authentication command failed for '${socket.printerId}' with error '${errorSummary(e)}'`,
          e.stack
        );
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Sent ${existingSockets.length} websocket authentication pings taking ${duration}ms.`);
  }
}

module.exports = { PrinterApiTestTask };
