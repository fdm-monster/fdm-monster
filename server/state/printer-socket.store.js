const { validateInput } = require("../handlers/validators");
const { createTestPrinterRules } = require("./validation/create-test-printer.validation");
const { errorSummary } = require("../utils/error.utils");
const { captureException } = require("@sentry/node");
const { printerEvents } = require("../constants/event.constants");
const { AppConstants } = require("../server.constants");
const { setTimeout, setInterval } = require("timers/promises");
const { Message, octoPrintEvent, SOCKET_STATE } = require("../services/octoprint/octoprint-sockio.adapter");

class PrinterSocketStore {
  /**
   * @private
   * @type {PrinterService}
   */
  printerService;
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
   * @type {Object.<string, PrinterEvents>}
   */
  printerEventsById = {};
  /**
   * @type {OctoPrintSockIoAdapter}
   */
  testSocket;
  /**
   * @type {LoggerService}
   */
  #logger;
  /**
   * @type {ConfigService}
   */
  configService;

  constructor({ socketFactory, socketIoGateway, eventEmitter2, printerCache, loggerFactory, configService }) {
    this.printerCache = printerCache;
    this.socketIoGateway = socketIoGateway;
    this.socketFactory = socketFactory;
    this.eventEmitter2 = eventEmitter2;
    this.#logger = loggerFactory("PrinterSocketStore");
    this.configService = configService;

    this.subscribeToEvents();
  }

  get _debugMode() {
    return this.configService.get(AppConstants.debugSocketMessagesKey, AppConstants.defaultDebugSocketMessages) === "true";
  }

  /**
   * @private
   */
  subscribeToEvents() {
    this.eventEmitter2.on("octoprint.*", (e) => this.onPrinterSocketMessage(e));
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

    const printerDocs = this.printerCache.listCachedPrinters(false);
    this.printerSocketAdaptersById = {};
    /**
     * @type {Printer}
     */
    for (const doc of printerDocs) {
      try {
        await this.handlePrinterCreated({ printer: doc });
      } catch (e) {
        this.#logger.error("SocketFactory failed to construct new OctoPrint socket.", errorSummary(e));
      }
    }

    this.#logger.log(`Loaded ${this.printerSocketAdaptersById.length} printer OctoPrint sockets`);
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
   * @param {string} id
   * @returns {*}
   */
  getPrinterSocketEvents(id) {
    return this.printerEventsById[id];
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
    for (const socket of Object.values(this.printerSocketAdaptersById)) {
      try {
        if (socket.needsReath()) {
          reauthRequested++;
          await socket.reauthSession();
        }
      } catch (e) {
        this.#logger.log("Failed to reauth printer socket", errorSummary(e));
        captureException(e);
      }

      try {
        if (socket.needsSetup() || socket.needsReopen()) {
          this.#logger.log(`Reopening socket for printerId '${socket.printerId}'`);
          socketSetupRequested++;
          await socket.setupSocketSession();
          socket.open();
        }
      } catch (e) {
        this.#logger.log("Failed to setup printer socket", errorSummary(e));
        captureException(e);
      }

      const keySocket = socket.socketState;
      const valSocket = socketStates[keySocket];
      socketStates[keySocket] = valSocket ? valSocket + 1 : 1;
      const keyApi = socket.apiState;
      const valApi = apiStates[keyApi];
      apiStates[keyApi] = valApi ? valApi + 1 : 1;
    }

    return {
      reauth: reauthRequested,
      socketSetup: socketSetupRequested,
      socket: socketStates,
      api: apiStates,
    };
  }

  /**
   * @private
   * @param {OctoPrintEventDto} e
   */
  onPrinterSocketMessage(e) {
    const printerId = e.printerId;
    const socket = this.getPrinterSocket(printerId);
    if (!socket) {
      return;
    }

    let ref = this.printerEventsById[e.printerId];
    if (!ref) {
      this.printerEventsById[e.printerId] = { current: null, history: null, timelapse: null, event: {}, plugin: {} };
      ref = this.printerEventsById[e.printerId];
    }
    if (e.event !== "plugin" && e.event !== "event") {
      ref[e.event] = { payload: e.payload, receivedAt: Date.now() };
      if (this._debugMode) {
        this.#logger.log(`Message '${e.event}' received`, e.printerId);
      }
    } else if (e.event === "plugin") {
      if (!ref["plugin"][e.payload.type]) {
        ref["plugin"][e.payload.plugin] = {
          payload: e.payload,
          receivedAt: Date.now(),
        };
      } else {
        ref["plugin"][e.payload.plugin] = {
          payload: e.payload,
          receivedAt: Date.now(),
        };
      }
    } else if (e.event === "event") {
      const eventType = e.payload.type;
      ref["event"][eventType] = {
        payload: e.payload.payload,
        receivedAt: Date.now(),
      };
      if (this._debugMode) {
        this.#logger.log(`Event '${eventType}' received`, e.printerId);
      }
    } else {
      this.#logger.log(`Message '${e.event}' received`, e.printerId);
    }
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
      this.#logger.log(`Printer '${id}' is disabled. Deleting socket.`);
      this.deleteSocket(id);
      return;
    }

    // Create a new socket if it doesn't exist
    if (!foundAdapter) {
      foundAdapter = this.socketFactory.createInstance();
      this.printerSocketAdaptersById[id] = foundAdapter;
    } else {
      foundAdapter.close();
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
    delete this.printerEventsById[printerId];
    delete this.printerSocketAdaptersById[printerId];
    // TODO mark diff cache
  }

  /**
   * Sets up/recreates a printer to be tested quickly by running the standard checks
   * @param printer
   * @returns {Promise<*>}
   */
  async setupTestPrinter(printer) {
    if (this.testSocket) {
      this.testSocket.close();
      this.testSocket = null;
    }

    const validatedData = await validateInput(printer, createTestPrinterRules);
    validatedData.enabled = true;

    // Create a new socket if it doesn't exist
    const { correlationToken } = printer;
    this.testSocket = this.socketFactory.createInstance();

    // Reset the socket credentials before (re-)connecting
    this.testSocket.registerCredentials({
      printerId: correlationToken,
      loginDto: {
        apiKey: printer.apiKey,
        printerURL: printer.printerURL,
      },
      protocol: "ws",
    });

    const testEvents = [
      octoPrintEvent(Message.WS_STATE_UPDATED),
      octoPrintEvent(Message.API_STATE_UPDATED),
      octoPrintEvent(Message.WS_CLOSED),
      octoPrintEvent(Message.WS_OPENED),
      octoPrintEvent(Message.WS_ERROR),
    ];
    const listener = ({ event, payload }) => {
      this.socketIoGateway.send("test-printer-state", {
        event,
        payload,
        correlationToken,
      });
    };

    const promise = new Promise(async (resolve, reject) => {
      testEvents.forEach((te) => {
        this.eventEmitter2.on(te, listener);
      });

      await this.testSocket.setupSocketSession().catch((e) => {
        this.testSocket.close();
        delete this.testSocket;
        testEvents.forEach((te) => {
          this.eventEmitter2.off(te, listener);
        });
        // TODO this reject is not caught
        reject(e);
      });
      this.testSocket.open();

      for await (const startTime of setInterval(100)) {
        if (this.testSocket.socketState === SOCKET_STATE.authenticated) {
          resolve();
          break;
        }
      }
    });

    await Promise.race([promise, setTimeout(AppConstants.defaultWebsocketHandshakeTimeout)]);
    this.testSocket.close();
    delete this.testSocket;
    testEvents.forEach((te) => {
      this.eventEmitter2.off(te, listener);
    });
  }
}

module.exports = PrinterSocketStore;
