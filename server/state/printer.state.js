const {
  getCurrentProfileDefault,
} = require("../services/octoprint/constants/octoprint-service.constants");
const { PEVENTS } = require("../constants/event.constants");
const {
  getDefaultPrinterState,
  WS_STATE,
  EVENT_TYPES,
  getDefaultDisabledPrinterState,
} = require("../services/octoprint/constants/octoprint-websocket.constants");
const { mapStateToColor, PSTATE, MESSAGE } = require("../constants/state.constants");
const Logger = require("../handlers/logger.js");
const { isTestEnvironment } = require("../utils/env.utils");

/**
 * This is a model to simplify unified printers state
 * This class is designed with serialization to network, file and possibly database in mind.
 */
class PrinterState {
  #id;
  #isTest;

  #hostState = {
    state: PSTATE.Offline,
    flags: {},
    colour: mapStateToColor(PSTATE.Offline),
    desc: "Setting up your Printer",
  };

  #websocketAdapter;
  #messageStream;
  #messageSubscription;
  #websocketAdapterType;
  #sessionUser;
  #sessionKey;

  #stepSize = 10; // 0.1, 1, 10 or 100
  #alerts = null;

  #entityData;

  // We could split this off to a substate cache container as this data is hot from OP
  #gcodeScripts;
  #octoPrintVersion;
  #octoPrintSystemInfo = {};
  #currentProfile = getCurrentProfileDefault();
  #octoPi;

  #markedForRemoval = false;
  #apiAccessibility = {
    accessible: true,
    retryable: true,
    reason: null,
  };

  #logger = new Logger("Printer-State");
  #eventEmitter2;
  #jobsCache;
  #fileCache;

  constructor({ eventEmitter2, jobsCache, fileCache }) {
    this.#eventEmitter2 = eventEmitter2;
    this.#jobsCache = jobsCache;
    this.#fileCache = fileCache;
  }

  get id() {
    return this.#id;
  }

  get isTest() {
    return this.#isTest;
  }

  get correlationToken() {
    if (this.isTest) return this.#entityData.correlationToken;
  }

  get markForRemoval() {
    return this.#markedForRemoval;
  }

  async setup(printerDocument, isTest = false) {
    if (!isTest) this.#id = printerDocument._id.toString();
    this.#isTest = isTest;

    this.updateEntityData(printerDocument, true);
  }

  async tearDown() {
    this.resetWebSocketAdapter();
    this.#markedForRemoval = true;

    if (this.isTest) return;

    this.#fileCache.purgePrinterId(this.#id);
    this.#jobsCache.purgePrinterId(this.#id);
  }

  /**
   * Update the in-memory copy of the document
   * @param printerDocument the database model to freeze
   * @param reconnect if true this will reconnect the client and WebSocket connection
   */
  updateEntityData(printerDocument, reconnect = false) {
    this.#entityData = Object.freeze({
      ...printerDocument._doc,
    });

    // We could compare previous and new data to check whether a reset is necessary
    if (reconnect) {
      this.resetConnectionState();
    }
  }

  updateLastPrintedFile(lastPrintedFile) {
    this.#entityData = {
      ...this.#entityData,
      lastPrintedFile,
    };
  }

  toFlat() {
    const convertedWSState = this.getWebSocketState();
    const opMeta = this.#websocketAdapter?.getOctoPrintMeta();

    // This fetches the job saved by this instance
    let flatJob = this.#jobsCache.getPrinterJobFlat(this.#id);

    const identification = this.isTest
      ? {
          correlationToken: this.#entityData.correlationToken,
          isTest: this.isTest,
        }
      : { id: this.#id };

    return Object.freeze({
      ...identification,
      printerState: this.getPrinterState(),
      apiAccessibility: this.#apiAccessibility,
      hostState: this.#hostState,
      webSocketState: convertedWSState,

      // ...
      costSettings: { ...this.#entityData.costSettings },

      // Caches
      currentJob: flatJob,

      // Hot OP data
      connectionOptions: {
        baudrates: [115200],
        baudratePreference: 115200,
        ports: [],
        portPreference: "VIRTUAL",
        printerProfiles: [],
        printerProfilePreference: "_default",
      },
      currentProfile: this.#currentProfile,
      octoPrintSystemInfo: this.#octoPrintSystemInfo,
      corsCheck: true,
      display: true, // TODO causes monitoring to show it. But it is not a proper place
      stepSize: this.#stepSize,
      alerts: this.#alerts,
      otherSettings: {
        temperatureTriggers: this.#entityData.tempTriggers,
        system: {
          commands: {},
        },
        webCamSettings: {},
      },
      octoPi: {
        version: "sure",
        model: "American Pi",
      },
      tools: [
        {
          time: 0,
          bed: {
            actual: 0,
          },
          chamber: {
            actual: 0,
          },
        },
      ],
      // Unmapped data - comes from database model so would be nicer to make a child object
      gcodeScripts: {},
      octoPrintVersion: this.getOctoPrintVersion(),
      lastPrintedFile: this.#entityData.lastPrintedFile || {
        parsedColor: "any",
        parsedVisualizationRAL: 0,
      },
      selectedFilament: this.#entityData.selectedFilament,
      enabled: this.#entityData.enabled,
      sortIndex: this.#entityData.sortIndex,
      printerName: this.#entityData.settingsAppearance?.name,
      webSocketURL: this.#websocketAdapter?.webSocketURL || this.#entityData.webSocketURL,
      camURL: this.#entityData.camURL,
      // apiKey: this.#entityData.apiKey, // INSECURE
      // currentUser // INSECURE
      printerURL: this.#entityData.printerURL,
      group: this.#entityData.group,
    });
  }

  /**
   * Reset the API state and dispose any websocket related data
   */
  resetConnectionState() {
    if (this.#entityData.enabled) {
      this.setHostState(PSTATE.Searching, "Attempting to connect to OctoPrint");
      this.resetApiAccessibility();
    } else {
      this.setHostState(PSTATE.Disabled, "Printer was disabled explicitly");
      this.setApiAccessibility(false, false, MESSAGE.disabled);
    }
    this.resetWebSocketAdapter();
  }

  /**
   * Another entity passes the acquired system info with handy metadata
   */
  updateSystemInfo(systemInfo) {
    this.#octoPrintSystemInfo = systemInfo;
  }

  updateStepSize(stepSize) {
    this.#stepSize = stepSize;
  }

  getSortIndex() {
    return this.#entityData.sortIndex;
  }

  getWebSocketState() {
    // Translate the adapter state to something the client knows
    const adapterState = this.getAdapterState();
    switch (adapterState.toString()) {
      case WS_STATE.connected:
        return {
          colour: "success",
          desc: "Connection tentative",
        };
      case WS_STATE.errored:
        return {
          colour: "warning",
          desc: adapterState,
        };
      case WS_STATE.authed:
        return {
          colour: "success",
          desc: adapterState,
        };
      default:
      case WS_STATE.unopened:
        return {
          colour: "danger",
          desc: adapterState,
        };
    }
  }

  getStateCategory() {
    const pState = this.getPrinterState();
    return pState.colour.category;
  }

  getPrinterState() {
    if (!this.#apiAccessibility.accessible) {
      return getDefaultDisabledPrinterState();
    }
    if (!this.#websocketAdapter) {
      return getDefaultPrinterState();
    }
    return this.#websocketAdapter.getPrinterState();
  }

  getURL() {
    return this.#entityData.printerURL;
  }

  getName() {
    return this.#entityData?.settingsAppearance?.name || this.#entityData.printerURL;
  }

  getOctoPrintVersion() {
    const opMeta = this.#websocketAdapter?.getOctoPrintMeta();
    const dbVersion = this.#entityData.octoPrintVersion;
    if (!opMeta) {
      return dbVersion;
    } else {
      if (dbVersion !== opMeta.octoPrintVersion && !!opMeta.octoPrintVersion) {
        // TODO prevent this in an earlier stage (like a websocket connect message)
        // TODO do something with this? This is a change of version.
      }
      return opMeta.octoPrintVersion;
    }
  }

  getLoginDetails() {
    return {
      printerURL: this.#entityData.printerURL,
      apiKey: this.#entityData.apiKey,
    };
  }

  bindWebSocketAdapter(adapterType) {
    if (!!this.#websocketAdapter) {
      throw new Error(
        `This websocket adapter was already bound with type '${
          this.#websocketAdapterType
        }'. Please reset it first with 'resetWebSocketAdapter' if you're switching over dynamically.`
      );
    }
    if (!this.#sessionUser || !this.#sessionKey) {
      throw new Error(
        "Printer State 'bindWebSocketAdapter' was called without 'sessionUser' or 'sessionKey' set-up correctly."
      );
    }

    this.#websocketAdapterType = adapterType?.name;
    this.#websocketAdapter = new adapterType({
      id: this.id,
      logger: this.#logger,
      webSocketURL: this.#entityData.webSocketURL,
      currentUser: this.#sessionUser,
      sessionKey: this.#sessionKey,
      throttle: 2,
    });

    this.#messageStream = this.#websocketAdapter.getMessages$();
  }

  /**
   * Connect the adapter to the configured transport using the constructor printer document and the bindWebSocketAdapter calls
   */
  connectAdapter() {
    if (!this.#websocketAdapter) {
      throw new Error(
        `The websocket adapter was not provided. Please reset it first with 'bindWebSocketAdapter' to connect to it.`
      );
    }
    this.#messageSubscription = this.#messageStream.subscribe(
      (r) => {
        r.forEach((event) => this.#processEvent(event));
      },
      (e) => {
        console.log("WS message stream error.");
      },
      (c) => {
        console.log("RxJS Subject WS complete");
      }
    );
  }

  sendPing() {
    this.#websocketAdapter.sendThrottleMessage();
  }

  setFirmwareState(name) {
    this.#octoPrintSystemInfo["printer.firmware"] = name;
  }

  #processEvent(event) {
    // Other interested parties can be informed
    event.data.printerId = this.#id;
    this.#eventEmitter2.emit(event.type, event.data);

    if (event.type === PEVENTS.event) {
      const data = event.data;
      if (data.type === EVENT_TYPES.FirmwareData) {
        // We can update Firmware from here
        this.setFirmwareState(data.payload.name);
      } else if (data.type === EVENT_TYPES.Disconnecting) {
        this.setFirmwareState("Disconnecting...");
      } else if (data.type === EVENT_TYPES.Disconnected) {
        this.setFirmwareState("-");
      }

      // TODO Process the event with the history store
      // if (
      //   [EVENT_TYPES.PrintCancelled, EVENT_TYPES.PrintDone, EVENT_TYPES.PrintFailed].includes(
      //     data.type
      //   )
      // ) {
      // }
    }
    if (event.type === PEVENTS.init) {
      this.#jobsCache.savePrinterJob(this.#id, event.data);
    }
    if (event.type === PEVENTS.current) {
      this.#jobsCache.updatePrinterJob(this.#id, event.data);
    }
  }

  isAdapterAuthed() {
    return this.getAdapterState() === WS_STATE.authed;
  }

  getAdapterState() {
    if (!this.#websocketAdapter) {
      return WS_STATE.unopened;
    }
    return this.#websocketAdapter.getWebSocketState();
  }

  shouldRetryConnect() {
    if (this.markForRemoval || !this.isApiRetryable()) {
      return false;
    }

    return [WS_STATE.unopened, WS_STATE.closed].includes(this.getAdapterState());
  }

  /**
   * Reset the type of adapter provided, saving/sending state, disposing and closing the sockets.
   */
  resetWebSocketAdapter() {
    // Call any closing message handlers now
    // ...
    if (this.#messageSubscription) {
      this.#messageSubscription.unsubscribe();
    }

    if (this.#websocketAdapter) {
      this.#websocketAdapter.close();
      // We nullify the adapter here for ease, but we should aim not to
      this.#websocketAdapter = null;

      this.#logger.warning("Reset printer websocket adapter.");
    }
  }

  setApiLoginSuccessState(sessionUser, sessionKey) {
    this.#sessionUser = sessionUser;
    this.#sessionKey = sessionKey;

    this.setHostState(PSTATE.Online, "Printer device is Online");
  }

  setHostState(state, description) {
    this.#hostState = {
      state,
      colour: mapStateToColor(state),
      desc: description,
    };
  }

  /**
   * Tracking for API failures like GlobalAPIKey, ApiKey rejected which can only be fixed manually
   */
  setApiAccessibility(accessible, retryable, reason) {
    if (!accessible) {
      if (!retryable && !isTestEnvironment())
        this.#logger.warning(
          `Printer API '${this.getName()}' was marked as inaccessible. Reason: '${reason}'. Please check connection settings.`
        );
    }
    this.#apiAccessibility = {
      accessible,
      retryable,
      reason,
    };
  }

  getApiAccessibility() {
    return Object.freeze(this.#apiAccessibility);
  }

  /**
   * Determines whether API was marked accessible - whether it should be skipped or not.
   * @returns {boolean}
   */
  isApiAccessible() {
    return this.#apiAccessibility.accessible;
  }

  isApiRetryable() {
    return this.isApiAccessible() || this.#apiAccessibility.retryable;
  }

  resetApiAccessibility() {
    this.setApiAccessibility(true, true, null);
  }
}

module.exports = PrinterState;
