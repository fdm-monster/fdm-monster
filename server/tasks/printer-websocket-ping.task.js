class PrinterWebsocketPingTask {
    #printersStore;
    #settingsStore;
    #octoPrintService;
    #taskManagerService;
    #logger;
    constructor({ printersStore, octoPrintApiService, settingsStore, taskManagerService, loggerFactory }) {
        this.#printersStore = printersStore;
        this.#settingsStore = settingsStore;
        this.#octoPrintService = octoPrintApiService;
        this.#taskManagerService = taskManagerService;
        this.#logger = loggerFactory("Printer-Websocket-Ping-Task");
    }
    getConnectedPrinters() {
        return this.#printersStore.listPrinterStates().filter((p) => p.isAdapterAuthed());
    }
    async run() {
        const startTime = Date.now();
        const printerStates = this.getConnectedPrinters();
        for (let printerState of printerStates) {
            try {
                // Pooling these promises with Promises.all or race is probably much faster
                printerState.sendPing();
            }
            catch (e) {
                this.#logger.error(`WebSocket ping command failed for '${printerState.getName()}'`, e.stack);
            }
        }
        const duration = Date.now() - startTime;
        this.#logger.info(`Sent ${printerStates.length} websocket pings taking ${duration}ms.`);
    }
}
export default PrinterWebsocketPingTask;
