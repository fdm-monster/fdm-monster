/**
 * Task which regularly cleans all printer files based on a configured predicate
 * This could be "older than 2 weeks". More options to be added on request.
 */
class PrinterFileCleanTask {
  #logger
  #printersStore;
  #octoPrintApiService;

  constructor({ printersStore, octoPrintApiService, loggerFactory }) {
    this.#printersStore = printersStore;
    this.#octoPrintApiService = octoPrintApiService;
    this.#logger = loggerFactory("Printer-FileClean-task");
  }

  async run() {
    const printers = this.#printersStore.listPrinterStates(false);
    this.#logger.info(`Cleaning files of ${printers.length} active printers. Syncing state first.`);

    // Filter printer states - cant clean unconnected OctoPrint instances

    for (let printer of printers) {
      await this.octoPrintFileSystemClean();
    }
  }

  async octoPrintFileSystemClean() {

  }
}

module.exports = PrinterFileCleanTask;
