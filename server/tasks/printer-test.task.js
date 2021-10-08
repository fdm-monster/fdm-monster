const { PSTATE, MESSAGE } = require("../constants/state.constants");
const HttpStatusCode = require("../constants/http-status-codes.constants");
const OctoprintRxjsWebsocketAdapter = require("../services/octoprint/octoprint-rxjs-websocket.adapter");
const {
  isLoginResponseGlobal
} = require("../services/octoprint/constants/octoprint-service.constants");
const DITokens = require("../container.tokens");

class PrinterTestTask {
  #lastTestRunTime;
  #printerSseHandler;

  #printersStore;
  #settingsStore;
  #octoPrintService;
  #taskManagerService;

  #logger;

  constructor({
                printersStore,
                octoPrintApiService,
                settingsStore,
                taskManagerService,
                loggerFactory,
                printerSseHandler
              }) {
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#octoPrintService = octoPrintApiService;
    this.#taskManagerService = taskManagerService;
    this.#printerSseHandler = printerSseHandler;
    this.#logger = loggerFactory("Printer-Test-task");
  }

  get maxRunTime() {
    return 10000; // 10 sec
  }

  async run() {
    const testPrinterState = this.#printersStore.getTestPrinter();
    const taskExpired = this.#lastTestRunTime
      ? Date.now() > this.#lastTestRunTime + this.maxRunTime
      : false;

    if (!testPrinterState?.toFlat || taskExpired) {
      this.#logger.info("Printer test task has expired or testPrinterState was not created.");
      if (testPrinterState?.toFlat) {
        await this.#printersStore.deleteTestPrinter();
      }

      this.#taskManagerService.disableJob(DITokens.printerTestTask);
      return;
    }

    await this.#testPrinterConnection(testPrinterState);
  }

  /**
   * Update the UI with test status
   * @param testPrinterState
   * @param progress
   * @returns {Promise<void>}
   */
  async #sendStateProgress(testPrinterState, progress) {
    const { correlationToken, hostState, printerState, webSocketState } = testPrinterState?.toFlat();
    const sseData = {
      testPrinter: {
        correlationToken,
        hostState,
        printerState,
        webSocketState
      },
      progress
    };

    const serializedData = JSON.stringify(sseData);
    this.#printerSseHandler.send(serializedData);
  }

  async #testPrinterConnection(printerState) {
    this.#lastTestRunTime = Date.now();
    const loginDetails = printerState.getLoginDetails();

    if (!printerState.shouldRetryConnect()) {
      return;
    }

    let errorThrown = false;
    let localError;

    const response = await this.#octoPrintService.login(loginDetails, true).catch((e) => {
      errorThrown = true;
      localError = e;
    });

    // Transport related error
    let errorCode = localError?.response?.status;
    if (errorThrown && !localError.response) {
      // Not connected or DNS issue - abort flow
      printerState.setHostState(PSTATE.Offline, MESSAGE.offline);
      printerState.setApiAccessibility(false, true, MESSAGE.retryingApiConnection);

      return await this.#sendStateProgress(printerState, { connected: false });
    }
    return await this.#sendStateProgress(printerState, { connected: true });

    // API related errors
    if (errorCode === HttpStatusCode.BAD_REQUEST) {
      // Bug
      printerState.setHostState(PSTATE.NoAPI, MESSAGE.badRequest);
      printerState.setApiAccessibility(false, false, MESSAGE.badRequest);

      return await this.#sendStateProgress(printerState, { connected: true, api_ok: false });
    }
    await this.#sendStateProgress(printerState, { connected: true, apiOk: true });

    // Response related errors
    const loginResponse = response.data;
    // This is a check which is best done after checking 400 code (GlobalAPIKey or pass-thru) - possible
    if (isLoginResponseGlobal(loginResponse)) {
      printerState.setHostState(PSTATE.GlobalAPIKey, MESSAGE.globalAPIKeyDetected);
      printerState.setApiAccessibility(false, false, MESSAGE.globalAPIKeyDetected);

      return await this.#sendStateProgress(printerState, { connected: true, apiOk: true, apiKeyNotGlobal: false });
    }
    await this.#sendStateProgress(printerState, { connected: true, apiOk: true, apiKeyNotGlobal: true });

    // Check for an name (defines connection state NoAPI) - undefined when apikey is wrong
    if (!loginResponse?.name) {
      printerState.setHostState(PSTATE.ApiKeyRejected, MESSAGE.apiKeyNotAccepted);
      printerState.setApiAccessibility(false, false, MESSAGE.apiKeyNotAccepted);

      return await this.#sendStateProgress(printerState, { connected: true, apiOk: true, apiKeyNotGlobal: true, apiKeyOk: false });
    }
    await this.#sendStateProgress(printerState, { connected: true, apiOk: true, apiKeyNotGlobal: true, apiKeyOk: true });

    // Sanity check for login success (alt: could also check status code) - quite rare
    if (!loginResponse?.session) {
      printerState.setHostState(PSTATE.NoAPI, MESSAGE.missingSessionKey);
      printerState.setApiAccessibility(false, false, MESSAGE.missingSessionKey);
      return;
    }

    printerState.setApiLoginSuccessState(loginResponse.name, loginResponse?.session);
    printerState.setApiAccessibility(true, true, null);
    printerState.resetWebSocketAdapter();
    printerState.bindWebSocketAdapter(OctoprintRxjsWebsocketAdapter);

    await this.#sendStateProgress(printerState, { connected: true, apiOk: true, apiKeyNotGlobal: true, apiKeyOk: true, websocketBound: true });

    // Delaying or staggering this will speed up startup tasks - ~90 to 150ms per printer on non-congested (W)LAN
    printerState.connectAdapter();
  }
}

module.exports = PrinterTestTask;
