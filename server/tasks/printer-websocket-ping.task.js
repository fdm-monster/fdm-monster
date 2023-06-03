const { SOCKET_STATE } = require("../services/octoprint/octoprint-sockio.adapter");
const { errorSummary } = require("../utils/error.utils");

class PrinterWebsocketPingTask {
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

  logger;

  constructor({ printerSocketStore, octoPrintApiService, settingsStore, taskManagerService, loggerFactory }) {
    this.printerSocketStore = printerSocketStore;
    this.settingsStore = settingsStore;
    this.octoPrintApiService = octoPrintApiService;
    this.taskManagerService = taskManagerService;
    this.logger = loggerFactory("Printer-Websocket-Ping-Task");
  }

  getOpenedSockets() {
    return Object.values(this.printerSocketStore.printerSocketAdaptersById).filter((s) => s.socketState === SOCKET_STATE.opened);
  }

  async run() {
    const startTime = Date.now();

    /**
     * @type {OctoPrintSockIoAdapter[]}
     */
    const sockets = this.getOpenedSockets();
    for (let socket of sockets) {
      try {
        // Pooling these promises with Promises.all or race is probably much faster
        await socket.setupSocketSession();
      } catch (e) {
        this.logger.error(
          `WebSocket authentication command failed for '${socket.printerId}' with error '${errorSummary(e)}'`,
          e.stack
        );
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Sent ${sockets.length} websocket authentication pings taking ${duration}ms.`);
  }
}

module.exports = PrinterWebsocketPingTask;
