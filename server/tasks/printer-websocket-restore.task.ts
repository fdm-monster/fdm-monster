const { errorSummary } = require("../utils/error.utils");
const { API_STATE } = require("../services/octoprint/octoprint-sockio.adapter");

class PrinterWebsocketRestoreTask {
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

  constructor({ printerSocketStore, octoPrintApiService, settingsStore, loggerFactory }) {
    this.printerSocketStore = printerSocketStore;
    this.octoPrintApiService = octoPrintApiService;
    this.settingsStore = settingsStore;
    this.logger = loggerFactory(PrinterWebsocketRestoreTask.name);
  }

  async run() {
    const startTime = Date.now();

    /**
     * @type {OctoPrintSockIoAdapter[]}
     */
    const existingSockets = this.printerSocketStore.listPrinterSockets();
    const resetAdapterIds = [];
    const silentSocketIds = [];
    for (const socket of existingSockets) {
      try {
        if (socket.isClosedOrAborted()) {
          socket.close();
          socket.resetSocketState();
          resetAdapterIds.push(socket.printerId);
          continue;
        }
      } catch (e) {
        this.logger.error(
          `WebSocket authentication command failed for '${socket.printerId}' with error '${errorSummary(e)}'`,
          e.stack
        );
        continue;
      }

      // Often due to USB disconnect, not interesting to reconnect unless we perform an API call for verification
      if (
        (socket.apiState !== API_STATE.unset && !socket.lastMessageReceivedTimestamp) ||
        Date.now() - socket.lastMessageReceivedTimestamp > 10 * 1000
      ) {
        silentSocketIds.push(socket.printerId);
        // Produce logs for silent sockets
        try {
          const result = await this.octoPrintApiService.getConnection(socket.loginDto);
          if (result?.current?.state !== "Closed") {
            this.logger.warn(
              `Silence was detected, but the OctoPrint current connection was not closed. Connection state ${result?.current?.state}, printerId: ${socket.printerId}.`
            );
          }
        } catch (e) {
          this.logger.error(
            `Silence was detected, but Websocket was not closed/aborted and API could not be called ${socket.printerId}.`
          );
        }
      }
    }

    const duration = Date.now() - startTime;
    if (this.settingsStore.getServerSettings()?.debugSettings?.debugSocketRetries) {
      this.logger.log(
        `Reset ${resetAdapterIds.length} closed/aborted sockets and detected ${silentSocketIds.length} silent sockets (duration ${duration}ms)`
      );
    }
  }
}

module.exports = { PrinterWebsocketRestoreTask };
