import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { FilesStore } from "@/state/files.store";
import { PrinterCache } from "@/state/printer.cache";
import { SettingsStore } from "@/state/settings.store";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";

/**
 * Task which regularly cleans all printer files based on a configured predicate
 * This could be "older than 2 weeks". More options to be added on request.
 */
export class PrinterFileCleanTask {
  logger: LoggerService;
  filesStore: FilesStore;
  printerCache: PrinterCache;
  settingsStore: SettingsStore;
  taskManagerService: TaskManagerService;
  octoPrintApiService: OctoPrintApiService;

  constructor({
    printerCache,
    filesStore,
    octoPrintApiService,
    taskManagerService,
    settingsStore,
    loggerFactory,
  }: {
    printerCache: PrinterCache;
    filesStore: FilesStore;
    octoPrintApiService: OctoPrintApiService;
    taskManagerService: TaskManagerService;
    settingsStore: SettingsStore;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerCache = printerCache;
    this.filesStore = filesStore;
    this.taskManagerService = taskManagerService;
    this.octoPrintApiService = octoPrintApiService;
    this.settingsStore = settingsStore;
    this.logger = loggerFactory(PrinterFileCleanTask.name);
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

  #getSettings() {
    return this.settingsStore.getFileCleanSettings();
  }
}
