const DITokens = require("../container.tokens");

/**
 * Task which regularly cleans all printer files based on a configured predicate
 * This could be "older than 2 weeks". More options to be added on request.
 */
class PrinterFileCleanTask {
  #logger;
  #filesStore;
  #printersStore;
  #taskManagerService;
  #settingsStore;
  #octoPrintApiService;

  constructor({ printersStore, filesStore, octoPrintApiService, taskManagerService, settingsStore, loggerFactory }) {
    this.#printersStore = printersStore;
    this.#filesStore = filesStore;
    this.#taskManagerService = taskManagerService;
    this.#octoPrintApiService = octoPrintApiService;
    this.#settingsStore = settingsStore;
    this.#logger = loggerFactory("Printer-FileClean-task");
  }

  async run() {
    const printers = this.#printersStore.listPrinterStates(false);
    const fileCleanSettings = this.#settingsStore.getPrinterFileCleanSettings();
    const autoCleanAtBootEnabled = fileCleanSettings.autoRemoveOldFilesAtBoot;

    try {
      if (autoCleanAtBootEnabled) {
        this.#logger.info(`Cleaning files of ${printers.length} active printers [printerFileClean:autoRemoveOldFilesAtBoot].`);
      } else {
        this.#logger.info(`Reporting about old files of ${printers.length} printers.`);
      }

      // Filter printer states - cant clean unconnected OctoPrint instances

      for (let printer of printers) {
        const outdatedFiles = this.getPrinterOutdatedFiles(printer);
        if (!outdatedFiles?.length) continue;

        // Report
        this.#logger.info(`Found ${outdatedFiles?.length} old files of ${printer.getName()}`);

        // Act
        if (autoCleanAtBootEnabled) {
          await this.octoPrintFileSystemClean(printer.id, outdatedFiles);
        }
      }
    } finally {
      this.#logger.info(`Printer file clean job ended`);
    }
  }

  /**
   * Scans the printers files and checks the outdated ones based on settings
   * @param printer
   */
  getPrinterOutdatedFiles(printer) {
    const fileCleanSettings = this.#settingsStore.getPrinterFileCleanSettings();
    const ageDaysMax = fileCleanSettings.autoRemoveOldFilesCriteriumDays;
    return this.#filesStore.getOutdatedFiles(printer.id, ageDaysMax);
  }

  async octoPrintFileSystemClean(printerId) {
    this.#octoPrintApiService.
  }
}

module.exports = PrinterFileCleanTask;
