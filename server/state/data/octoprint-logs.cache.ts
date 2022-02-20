export class OctoPrintLogsCache {
    #octoPrintLogs = [];
    #lastLogId = -1;

    addOctoPrintLog(printer, message, state, plugin) {
        let id = this.#lastLogId + 1;
        this.#lastLogId++;
        const newLog = {
            id: id,
            date: new Date(),
            message: message,
            printerID: printer._id,
            printer: printer.printerURL,
            state: state,
            pluginDisplay: plugin
        };
        this.#octoPrintLogs.push(newLog);
        if (this.#octoPrintLogs.length >= 2000) {
            this.#octoPrintLogs.shift();
        }
    }

    getOctoPrintLogs() {
        return this.#octoPrintLogs;
    }
}
