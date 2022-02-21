/**
 * Task which regularly cleans all printer files based on a configured predicate
 * This could be "older than 2 weeks". More options to be added on request.
 */
class PrinterFileCleanTask {
  #logger;
  #filesStore;
  #printersStore;
  #serverSettingsService;
  #octoPrintApiService;

  constructor({ printersStore, filesStore, octoPrintApiService, serverSettingsService, loggerFactory }) {
    this.#printersStore = printersStore;
    this.#filesStore = filesStore;
    this.#octoPrintApiService = octoPrintApiService;
    this.#serverSettingsService = serverSettingsService;
    this.#logger = loggerFactory("Printer-FileClean-task");
  }

  async run() {
    const printers = this.#printersStore.listPrinterStates(false);
    this.#logger.info(`Cleaning files of ${printers.length} active printers. Syncing state first.`);

    // Filter printer states - cant clean unconnected OctoPrint instances

    for (let printer of printers) {
      const outdatedFiles = this.getPrinterOutdatedFiles(printer);
      await this.octoPrintFileSystemClean();
    }
  }

  /**
   * Scans the printers files and checks the outdated ones based on settings
   * @param printer
   */
  getPrinterOutdatedFiles(printer) {
    const printerFiles = this.#filesStore.getFiles(printer.id);

    return printerFiles;
  }

  async octoPrintFileSystemClean() {

  }
}

module.exports = PrinterFileCleanTask;
