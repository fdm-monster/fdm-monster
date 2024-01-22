import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { PrinterCache } from "@/state/printer.cache";
import { SettingsStore } from "@/state/settings.store";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { IdType } from "@/shared.constants";
import { PrinterDto } from "@/services/interfaces/printer.dto";

/**
 * Task which regularly cleans all printer files based on a configured predicate
 * This could be "older than 2 weeks". More options to be added on request.
 */
export class PrinterFileCleanTask {
  logger: LoggerService;
  printerFilesStore: PrinterFilesStore;
  printerCache: PrinterCache;
  settingsStore: SettingsStore;
  taskManagerService: TaskManagerService;
  octoPrintApiService: OctoPrintApiService;

  constructor({
    printerCache,
    printerFilesStore,
    octoPrintApiService,
    taskManagerService,
    settingsStore,
    loggerFactory,
  }: {
    printerCache: PrinterCache;
    printerFilesStore: PrinterFilesStore;
    octoPrintApiService: OctoPrintApiService;
    taskManagerService: TaskManagerService;
    settingsStore: SettingsStore;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerCache = printerCache;
    this.printerFilesStore = printerFilesStore;
    this.taskManagerService = taskManagerService;
    this.octoPrintApiService = octoPrintApiService;
    this.settingsStore = settingsStore;
    this.logger = loggerFactory(PrinterFileCleanTask.name);
  }

  private get ageDaysMaxSetting() {
    return this.getSettings().autoRemoveOldFilesCriteriumDays;
  }

  async run() {
    // TODO filter disconnected printers
    const printers = await this.printerCache.listCachedPrinters(false);
    const fileCleanSettings = this.getSettings();
    const autoCleanAtBootEnabled = fileCleanSettings.autoRemoveOldFilesAtBoot;

    try {
      if (autoCleanAtBootEnabled) {
        this.logger.log(`Cleaning files of ${printers.length} active printers [printerFileClean:autoRemoveOldFilesAtBoot].`);
      } else {
        this.logger.log(`Reporting about old files of ${printers.length} printers.`);
      }

      const errorPrinters = [];
      for (let printer of printers) {
        try {
          await this.printerFilesStore.eagerLoadPrinterFiles(printer.id, false);
        } catch (e) {
          errorPrinters.push({ e, printer });
        }
      }
      if (errorPrinters.length > 0) {
        this.logger.error(
          `Error loading some files, ${errorPrinters.length} printer(s) (${errorPrinters.map(
            (ep) => `${ep.printer.name} ${ep.e.toString()}`
          )}) did not respond or returned an unexpected status code. Those will depend on previously cached files.`
        );
      }

      // Filter printer states - cant clean unconnected OctoPrint instances
      for (let printer of printers) {
        const outdatedFiles = this.getPrinterOutdatedFiles(printer);
        if (!outdatedFiles?.length) continue;

        // Report
        this.logger.log(`Found ${outdatedFiles?.length} old files of ${printer.name}`);

        if (autoCleanAtBootEnabled) {
          await this.cleanPrinterFiles(printer.id);
        }
      }
    } finally {
      this.logger.log(`Printer old file analysis job ended`);
    }
  }

  async cleanPrinterFiles(printerId: IdType) {
    // Act
    await this.printerFilesStore.deleteOutdatedFiles(printerId, this.ageDaysMaxSetting);

    // Update printer files
    await this.printerFilesStore.eagerLoadPrinterFiles(printerId, false);
  }

  /**
   * Scans the printers files and checks the outdated ones based on settings
   * @param printer
   */
  getPrinterOutdatedFiles(printer: PrinterDto<IdType>) {
    const ageDaysMax = this.ageDaysMaxSetting;
    return this.printerFilesStore.getOutdatedFiles(printer.id, ageDaysMax);
  }

  private getSettings() {
    return this.settingsStore.getFileCleanSettings();
  }
}
