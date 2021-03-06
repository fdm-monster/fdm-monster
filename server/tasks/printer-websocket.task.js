const OctoprintRxjsWebsocketAdapter = require("../services/octoprint/octoprint-rxjs-websocket.adapter");
const DITokens = require("../container.tokens");
const { PSTATE, ERR_COUNT, MESSAGE } = require("../constants/state.constants");
const HttpStatusCode = require("../constants/http-status-codes.constants");
const { ExternalServiceError } = require("../exceptions/runtime.exceptions");
const {
  isLoginResponseGlobal
} = require("../services/octoprint/constants/octoprint-service.constants");

class PrinterWebsocketTask {
  #printersStore;
  #settingsStore;
  #octoPrintService;
  #taskManagerService;

  #logger;

  #errorMaxThrows = 3;
  #errorModulus = 50; // After max throws, log it every x failures
  #errorCounts = {
    [ERR_COUNT.offline]: {},
    [ERR_COUNT.notOctoPrint]: {},
    [ERR_COUNT.apiKeyNotAccepted]: {},
    [ERR_COUNT.apiKeyIsGlobal]: {},
    [ERR_COUNT.missingSessionKey]: {}
  };

  constructor({
    printersStore,
    octoPrintApiService,
    settingsStore,
    taskManagerService,
    loggerFactory,
    printerSystemTask // Just to make sure it can resolve
  }) {
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#octoPrintService = octoPrintApiService;
    this.#taskManagerService = taskManagerService;
    this.#logger = loggerFactory("Printer-Websocket-Task");
  }

  getRetriedPrinters() {
    return this.#printersStore.listPrinterStates().filter((p) => p.shouldRetryConnect());
  }

  async run() {
    const startTime = Date.now();

    const printerStates = this.getRetriedPrinters();
    for (let printerState of printerStates) {
      try {
        // Pooling these promises with Promises.all or race is probably much faster
        await this.setupPrinterConnection(printerState);
      } catch (e) {
        this.#logger.error(`WebSocket task failed for '${printerState.getName()}'`, e.stack);
      }
    }

    const newPrinterStates = this.getRetriedPrinters();

    const duration = Date.now() - startTime;
    if (newPrinterStates.length !== printerStates.length) {
      this.#logger.info(
        `Attempted websocket connections taking ${duration}ms. ${newPrinterStates.length} adapters need retry (before: ${printerStates.length}).`
      );
    }

    // Continue with delegate tasks
    const taskName = DITokens.printerSystemTask;
    if (this.#taskManagerService.isTaskDisabled(taskName)) {
      this.#logger.info(`Triggered conditional task '${taskName}' to run`);
      this.#taskManagerService.scheduleDisabledJob(taskName);
    }
  }

  async setupPrinterConnection(printerState) {
    const loginDetails = printerState.getLoginDetails();
    const printerName = printerState.getName();
    const printerId = printerState.id;

    if (!printerState.shouldRetryConnect()) {
      return;
    }

    let errorThrown = false;
    let localError;

    const response = await this.#octoPrintService.login(loginDetails, true).catch((e) => {
      errorThrown = true;
      localError = e;
    });

    let errorCode = localError?.response?.status;
    // Transport related error
    if (errorThrown && !localError.response?.data) {
      // Not connected or DNS issue - abort flow
      const errorCount = this.#incrementErrorCount(ERR_COUNT.offline, printerId);
      printerState.setHostState(PSTATE.Offline, MESSAGE.offline);
      printerState.setApiAccessibility(false, true, MESSAGE.retryingApiConnection);
      return this.handleSilencedError(errorCount, MESSAGE.retryingApiConnection, printerName, true);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.offline, printerId);
    }

    // Illegal API response
    if (errorThrown && errorCode === HttpStatusCode.NOT_FOUND) {
      const errorCount = this.#incrementErrorCount(ERR_COUNT.notOctoPrint, printerId);
      printerState.setHostState(PSTATE.NoAPI, MESSAGE.notOctoPrint);
      printerState.setApiAccessibility(false, false, MESSAGE.notOctoPrint);
      return this.handleSilencedError(errorCount, MESSAGE.notOctoPrint, printerName, true);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.notOctoPrint, printerId);
    }

    // API related errors or empty response
    if (errorCode === HttpStatusCode.BAD_REQUEST) {
      // Bug
      printerState.setHostState(PSTATE.NoAPI, MESSAGE.badRequest);
      printerState.setApiAccessibility(false, false, MESSAGE.badRequest);
      throw new ExternalServiceError(localError?.response?.data);
    }

    // Response related errors
    const loginResponse = response?.data;
    // This is a check which is best done after checking 400 code (GlobalAPIKey or pass-thru) - possible
    if (isLoginResponseGlobal(loginResponse)) {
      const errorCount = this.#incrementErrorCount(ERR_COUNT.apiKeyIsGlobal, printerId);
      printerState.setHostState(PSTATE.GlobalAPIKey, MESSAGE.globalAPIKeyDetected);
      printerState.setApiAccessibility(false, false, MESSAGE.globalAPIKeyDetected);
      return this.handleSilencedError(errorCount, MESSAGE.globalAPIKeyDetected, printerName);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.apiKeyIsGlobal, printerId);
    }
    // Check for an name (defines connection state NoAPI) - undefined when apikey is wrong
    if (!loginResponse?.name) {
      const errorCount = this.#incrementErrorCount(ERR_COUNT.apiKeyNotAccepted, printerId);
      printerState.setHostState(PSTATE.ApiKeyRejected, MESSAGE.apiKeyNotAccepted);
      printerState.setApiAccessibility(false, false, MESSAGE.apiKeyNotAccepted);
      return this.handleSilencedError(errorCount, MESSAGE.apiKeyNotAccepted, printerName);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.apiKeyNotAccepted, printerId);
    }
    // Sanity check for login success (alt: could also check status code) - quite rare
    if (!loginResponse?.session) {
      const errorCount = this.#incrementErrorCount(ERR_COUNT.missingSessionKey, printerId);
      printerState.setHostState(PSTATE.NoAPI, MESSAGE.missingSessionKey);
      printerState.setApiAccessibility(false, false, MESSAGE.missingSessionKey);
      return this.handleSilencedError(errorCount, MESSAGE.missingSessionKey, printerName);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.missingSessionKey, printerId);
    }

    printerState.setApiLoginSuccessState(loginResponse.name, loginResponse?.session);
    printerState.setApiAccessibility(true, true, null);
    printerState.resetWebSocketAdapter();
    // TODO time this (I wonder if the time spent is logging in or the binding)
    printerState.bindWebSocketAdapter(OctoprintRxjsWebsocketAdapter);

    // TODO time this
    // Delaying or staggering this will speed up startup tasks - ~90 to 150ms per printer on non-congested (W)LAN
    printerState.connectAdapter();
  }

  #incrementErrorCount(key, printerId) {
    const errorType = this.#errorCounts[key];
    if (!errorType[printerId]) {
      errorType[printerId] = 1;
    } else {
      errorType[printerId]++;
    }
    return errorType[printerId];
  }

  #resetPrinterErrorCount(key, printerId) {
    delete this.#getPrinterErrorCount(key, printerId);
  }

  #getPrinterErrorCount(key, printerId) {
    return this.#errorCounts[key][printerId] || 0;
  }

  handleSilencedError(errorCount, taskMessage, printerName, willRetry = false) {
    if (errorCount <= this.#errorMaxThrows) {
      const retrySilencePostFix = willRetry
        ? `(Error muted in ${this.#errorMaxThrows - errorCount} tries.)`
        : "(Not retried)";
      throw new Error(`${taskMessage} ${retrySilencePostFix}`);
    } else if (errorCount % this.#errorModulus === 0) {
      throw new Error(`${taskMessage} ${errorCount} times for printer '${printerName}'.`);
    }
    // Really nice for debug or dev, but not for normal usage
    // else {
    //   return this.#logger.error("Websocket connection attempt failed (silenced).");
    // }
  }
}

module.exports = PrinterWebsocketTask;
