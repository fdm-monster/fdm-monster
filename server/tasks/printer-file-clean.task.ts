const { DITokens } = require("../container.tokens");

/**
 * Task which regularly cleans all printer files based on a configured predicate
 * This could be "older than 2 weeks". More options to be added on request.
 */
export class PrinterFileCleanTask {
  logger;
  /**
   * @type {FilesStore}
   */
  filesStore;
  /**
   * @type {PrinterCache}
   */
  printerCache;
  /**
   * @type {SettingsStore}
   */
  settingsStore;
  /**
   * @type {TaskManagerService}
   */
  taskManagerService;
  /**
   * @type {OctoPrintApiService}
   */
  octoPrintApiService;

  constructor({ printerCache, filesStore, octoPrintApiService, taskManagerService, settingsStore, loggerFactory }) {
    this.printerCache = printerCache;
    this.filesStore = filesStore;
    this.taskManagerService = taskManagerService;
    this.octoPrintApiService = octoPrintApiService;
    this.settingsStore = settingsStore;
    this.logger = loggerFactory("Printer-FileClean-task");
  }

  #getSettings() {
    return this.settingsStore.getFileCleanSettings();
  }

  get #ageDaysMaxSetting() {
    return this.#getSettings().autoRemoveOldFilesCriteriumDays;
  }

  async run() {
    // TODO filter disconnected printers
    const printers = await this.printerCache.listCachedPrinters(false);
    const fileCleanSettings = this.#getSettings();
    const autoCleanAtBootEnabled = fileCleanSettings.autoRemoveOldFilesAtBoot;

    try {
      if (autoCleanAtBootEnabled) {
        this.logger.log(`Cleaning files of ${printers.length} active printers [printerFileClean:autoRemoveOldFilesAtBoot].`);
      } else {
        this.logger.log(`Reporting about old files of ${printers.length} printers.`);
      }

      // Filter printer states - cant clean unconnected OctoPrint instances
      for (let printer of printers) {
        const outdatedFiles = this.getPrinterOutdatedFiles(printer);
        if (!outdatedFiles?.length) continue;

        // Report
        this.logger.log(`Found ${outdatedFiles?.length} old files of ${printer.printerName}`);

        if (autoCleanAtBootEnabled) {
          await this.cleanPrinterFiles(printer.id);
        }
      }
    } finally {
      this.logger.log(`Printer old file analysis job ended`);
    }
  }

  async cleanPrinterFiles(printerId) {
    // Act
    await this.filesStore.deleteOutdatedFiles(printerId, this.#ageDaysMaxSetting);

    // Update printer files
    await this.filesStore.eagerLoadPrinterFiles(printerId, false);
  }

  /**
   * Scans the printers files and checks the outdated ones based on settings
   * @param printer
   */
  getPrinterOutdatedFiles(printer) {
    const ageDaysMax = this.#ageDaysMaxSetting;
    return this.filesStore.getOutdatedFiles(printer.id, ageDaysMax);
  }
}

module.exports = PrinterFileCleanTask;
