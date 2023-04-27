const HttpStatusCode = require("../constants/http-status-codes.constants");
const OctoprintRxjsWebsocketAdapter = require("../services/octoprint/octoprint-rxjs-websocket.adapter");
const {
  isLoginResponseGlobal,
} = require("../services/octoprint/constants/octoprint-service.constants");
const DITokens = require("../container.tokens");
const { IO_MESSAGES } = require("../state/socket-io.gateway");

class PrinterTestTask {
  #lastTestRunTime;
  #socketIoGateway;

  #printerStore;
  #settingsStore;
  #octoPrintService;
  #taskManagerService;

  #logger;

  constructor({
    printerStore,
    octoPrintApiService,
    settingsStore,
    taskManagerService,
    loggerFactory,
    socketIoGateway,
  }) {
    this.#printerStore = printerStore;
    this.#settingsStore = settingsStore;
    this.#octoPrintService = octoPrintApiService;
    this.#taskManagerService = taskManagerService;
    this.#socketIoGateway = socketIoGateway;
    this.#logger = loggerFactory(PrinterTestTask.name);
  }

  get maxRunTime() {
    return 10000; // 10 sec
  }

  async run() {
    const testPrinterState = this.#printerStore.getTestPrinter();
    const taskExpired = this.#lastTestRunTime
      ? Date.now() <= this.#lastTestRunTime + this.maxRunTime
      : false;

    if (!testPrinterState?.toFlat || taskExpired) {
      this.#stopRunning();

      if (testPrinterState?.toFlat) {
        await this.#printerStore.deleteTestPrinter();
      }

      this.#taskManagerService.disableJob(DITokens.printerTestTask);
      return;
    }

    await this.#testPrinterConnection(testPrinterState);
    this.#stopRunning();
  }

  #stopRunning() {
    this.#lastTestRunTime = undefined;
    this.#taskManagerService.disableJob(DITokens.printerTestTask);
    this.#logger.info("Printer test task has stopped running and is disabled.");
  }

  /**
   * Update the UI with test status
   * @param testPrinterState
   * @param progress
   * @returns {Promise<void>}
   */
  async #sendStateProgress(testPrinterState, progress) {
    const { printerURL, printerName, apiKey, correlationToken } = testPrinterState?.toFlat();
    const socketIoData = {
      testPrinter: {
        printerURL,
        printerName,
        apiKey,
        correlationToken,
      },
      testProgress: progress,
    };

    const serializedData = JSON.stringify(socketIoData);
    this.#socketIoGateway.send(IO_MESSAGES.LegacyPrinterTest, serializedData);
  }

  async #testPrinterConnection(printerState) {
    this.#lastTestRunTime = Date.now();
    const loginDetails = printerState.getLoginDetails();

    if (!printerState.shouldRetryConnect()) {
      return;
    }

    let errorThrown = false;
    let localError;

    const responseObject = await this.#octoPrintService.login(loginDetails, true).catch((e) => {
      errorThrown = true;
      localError = e;
    });

    let errorCode = localError?.response?.status;
    // Transport related error
    if (errorThrown && !localError.response?.data) {
      return await this.#sendStateProgress(printerState, { connected: false });
    }
    await this.#sendStateProgress(printerState, { connected: true });

    // Illegal API response
    if (errorThrown && errorCode === HttpStatusCode.NOT_FOUND) {
      return await this.#sendStateProgress(printerState, { connected: true, isOctoPrint: false });
    }
    await this.#sendStateProgress(printerState, { connected: true, isOctoPrint: true });

    // API related errors
    if (errorCode === HttpStatusCode.BAD_REQUEST) {
      return await this.#sendStateProgress(printerState, { connected: true, apiOk: false });
    }
    await this.#sendStateProgress(printerState, {
      connected: true,
      isOctoPrint: true,
      apiOk: true,
    });

    // Response related errors
    const loginResponse = responseObject?.data;
    // This is a check which is best done after checking 400 code (GlobalAPIKey or pass-thru) - possible
    if (isLoginResponseGlobal(loginResponse)) {
      return await this.#sendStateProgress(printerState, {
        connected: true,
        isOctoPrint: true,
        apiOk: true,
        apiKeyNotGlobal: false,
      });
    }
    await this.#sendStateProgress(printerState, {
      connected: true,
      isOctoPrint: true,
      apiOk: true,
      apiKeyNotGlobal: true,
    });

    // Check for an name (defines connection state NoAPI) - undefined when apikey is wrong
    if (!loginResponse?.name) {
      return await this.#sendStateProgress(printerState, {
        connected: true,
        isOctoPrint: true,
        apiOk: true,
        apiKeyNotGlobal: true,
        apiKeyOk: false,
      });
    }
    await this.#sendStateProgress(printerState, {
      connected: true,
      isOctoPrint: true,
      apiOk: true,
      apiKeyNotGlobal: true,
      apiKeyOk: true,
    });

    // Sanity check for login success (alt: could also check status code) - quite rare
    if (!loginResponse?.session) {
      return await this.#sendStateProgress(printerState, {
        connected: true,
        isOctoPrint: true,
        apiOk: true,
        apiKeyNotGlobal: true,
        apiKeyOk: true,
        websocketBound: false,
      });
    }

    printerState.setApiLoginSuccessState(loginResponse.name, loginResponse?.session);
    printerState.setApiAccessibility(true, true, null);
    printerState.resetWebSocketAdapter();
    printerState.bindWebSocketAdapter(OctoprintRxjsWebsocketAdapter);

    // Delaying or staggering this will speed up startup tasks - ~90 to 150ms per printer on non-congested (W)LAN
    printerState.connectAdapter();

    await this.#sendStateProgress(printerState, {
      connected: true,
      isOctoPrint: true,
      apiOk: true,
      apiKeyNotGlobal: true,
      apiKeyOk: true,
      websocketBound: true,
    });
  }
}

module.exports = PrinterTestTask;
