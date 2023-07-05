const { errorSummary } = require("../utils/error.utils");
const { captureException } = require("@sentry/node");
const { printerEvents } = require("../constants/event.constants");

class PrinterSocketStore {
  /**
   * @type {SocketIoGateway}
   */
  socketIoGateway;
  /**
   * @type {SocketFactory}
   */
  socketFactory;
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;
  /**
   * @type{PrinterCache}
   **/
  printerCache;
  /**
   * @type {Object.<string, OctoPrintSockIoAdapter>}
   */
  printerSocketAdaptersById = {};
  /**
   * @type {LoggerService}
   */
  logger;
  /**
   * @type {ConfigService}
   */
  configService;
  /**
   * @type {SettingsStore}
   */
  settingsStore;

  constructor({ socketFactory, socketIoGateway, settingsStore, eventEmitter2, printerCache, loggerFactory, configService }) {
    this.printerCache = printerCache;
    this.socketIoGateway = socketIoGateway;
    this.socketFactory = socketFactory;
    this.eventEmitter2 = eventEmitter2;
    this.settingsStore = settingsStore;
    this.logger = loggerFactory("PrinterSocketStore");
    this.configService = configService;

    this.subscribeToEvents();
  }

  /**
   * @private
   */
  subscribeToEvents() {
    this.eventEmitter2.on(printerEvents.printerCreated, this.handlePrinterCreated.bind(this));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
    this.eventEmitter2.on(printerEvents.printerUpdated, this.handlePrinterUpdated.bind(this));
    this.eventEmitter2.on(printerEvents.batchPrinterCreated, this.handleBatchPrinterCreated.bind(this));
  }

  getSocketStatesById() {
    const socketStatesById = {};
    Object.values(this.printerSocketAdaptersById).forEach((s) => {
      socketStatesById[s.printerId] = {
        printerId: s.printerId,
        socket: s.socketState,
        api: s.apiState,
      };
    });
    return socketStatesById;
  }

  /**
   * Load all printers into cache, and create a new socket for each printer (if enabled)
   * @param {OctoPrintEventDto} e
   */
  async loadPrinterSockets() {
    await this.printerCache.loadCache();

    const printerDocs = await this.printerCache.listCachedPrinters(false);
    this.printerSocketAdaptersById = {};
    /**
     * @type {Printer}
     */
    for (const doc of printerDocs) {
      try {
        await this.handlePrinterCreated({ printer: doc });
      } catch (e) {
        this.logger.error("PrinterSocketStore failed to construct new OctoPrint socket.", errorSummary(e));
      }
    }

    this.logger.log(`Loaded ${Object.keys(this.printerSocketAdaptersById).length} printer OctoPrint sockets`);
  }

  listPrinterSockets() {
    return Object.values(this.printerSocketAdaptersById);
  }

  /**
   * Reconnect the OctoPrint Websocket connection
   * @param id
   */
  reconnectOctoPrint(id) {
    const socket = this.getPrinterSocket(id);
    socket.close();

    // The reconnect task will pick up this state and reconnect
    socket.resetSocketState();
  }

  /**
   * @param {string} id
   * @returns {OctoPrintSockIoAdapter}
   */
  getPrinterSocket(id) {
    return this.printerSocketAdaptersById[id];
  }

  /**
   * Sets up the new WebSocket connections for all printers
   * @returns {Promise<void>}
   */
  async reconnectPrinterSockets() {
    let reauthRequested = 0;
    let socketSetupRequested = 0;
    const socketStates = {};
    const apiStates = {};
    const promisesReauth = [];
    const failedSocketsReauth = [];
    for (const socket of Object.values(this.printerSocketAdaptersById)) {
      try {
        if (socket.needsReauth()) {
          reauthRequested++;
          const promise = socket.reauthSession().catch((_) => {
            failedSocketsReauth.push(socket.printerId);
          });
          promisesReauth.push(promise);
        }
      } catch (e) {
        if (this.settingsStore.getServerSettings().debugSettings?.debugSocketSetup) {
          this.logger.log("Failed to reauth printer socket", errorSummary(e));
        }
        captureException(e);
      }
    }

    await Promise.all(promisesReauth);

    const promisesOpenSocket = [];
    const failedSocketReopened = [];
    for (const socket of Object.values(this.printerSocketAdaptersById)) {
      try {
        if (socket.needsSetup() || socket.needsReopen()) {
          if (this.settingsStore.getServerSettings().debugSettings?.debugSocketSetup) {
            this.logger.log(
              `Reopening socket for printerId '${
                socket.printerId
              }' (setup: ${socket.needsSetup()}, reopen: ${socket.needsReopen()})`
            );
          }
          socketSetupRequested++;
          const promise = socket
            .setupSocketSession()
            .then(() => {
              socket.open();
            })
            .catch((_) => {
              failedSocketReopened.push(socket.printerId);
            });
          promisesOpenSocket.push(promise);
        }
      } catch (e) {
        if (this.settingsStore.getServerSettings().debugSettings?.debugSocketSetup) {
          this.logger.log(`Failed to setup printer socket ${errorSummary(e)}`);
        }
        captureException(e);
      }

      const keySocket = socket.socketState;
      const valSocket = socketStates[keySocket];
      socketStates[keySocket] = valSocket ? valSocket + 1 : 1;
      const keyApi = socket.apiState;
      const valApi = apiStates[keyApi];
      apiStates[keyApi] = valApi ? valApi + 1 : 1;
    }

    await Promise.all(promisesOpenSocket);

    return {
      reauth: reauthRequested,
      failedSocketReopened,
      failedSocketsReauth,
      socketSetup: socketSetupRequested,
      socket: socketStates,
      api: apiStates,
    };
  }

  handleBatchPrinterCreated({ printers }) {
    for (const p of printers) {
      this.handlePrinterCreated({ printer: p });
    }
  }

  /**
   * @private
   * @param { printer: Printer } printer
   * @returns void
   */
  handlePrinterCreated({ printer }) {
    this.createOrUpdateSocket(printer);
  }

  /**
   * @private
   * @param { printer: Printer } printer
   * @returns void
   */
  handlePrinterUpdated({ printer }) {
    this.logger.log(`Printer '${printer.id}' updated. Updating socket.`);
    this.createOrUpdateSocket(printer);
  }

  /**
   * @param { printer: Printer } printer
   * @returns void
   */
  createOrUpdateSocket(printer) {
    const { enabled, id } = printer;
    let foundAdapter = this.printerSocketAdaptersById[id.toString()];

    // Delete the socket if the printer is disabled
    if (!enabled) {
      this.logger.log(`Printer '${id}' is disabled. Deleting socket.`);
      this.deleteSocket(id);
      return;
    }

    // Create a new socket if it doesn't exist
    if (!foundAdapter) {
      foundAdapter = this.socketFactory.createInstance();
      this.printerSocketAdaptersById[id] = foundAdapter;
    } else {
      foundAdapter.close();
      this.logger.log(`Closing printer '${id}' socket for update.`);
    }

    // Reset the socket credentials before (re-)connecting
    foundAdapter.registerCredentials({
      printerId: printer.id.toString(),
      loginDto: {
        apiKey: printer.apiKey,
        printerURL: printer.printerURL,
      },
      protocol: "ws",
    });
    foundAdapter.resetSocketState();
  }

  handlePrintersDeleted({ printerIds }) {
    printerIds.forEach((id) => {
      this.deleteSocket(id);
    });
  }

  /**
   * @private
   * @param {string} printerId
   */
  deleteSocket(printerId) {
    const socket = this.printerSocketAdaptersById[printerId];
    if (!!socket) {
      socket.close();
    }
    // TODO mark diff cache
    delete this.printerSocketAdaptersById[printerId];
  }
}

module.exports = PrinterSocketStore;
