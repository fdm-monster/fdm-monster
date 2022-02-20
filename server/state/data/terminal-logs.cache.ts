class TerminalLogsCache {
    #terminalCache;
    #printerTickerStore;
    #printersStore;
    constructor({ printerTickerStore, printersStore }) {
        this.#printerTickerStore = printerTickerStore;
        this.#printersStore = printersStore;
    }
    getPrinterTerminalLogs(printerId) {
        if (!this.#terminalCache)
            return;
        return this.#terminalCache.find((tl) => (tl.printerId = printerId));
    }
}
export default TerminalLogsCache;
