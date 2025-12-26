import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { PrinterCache } from "@/state/printer.cache";
import { SettingsStore } from "@/state/settings.store";
import { PrinterDto } from "@/services/interfaces/printer.dto";

/**
 * Task which regularly cleans all printer files based on a configured predicate
 * This could be "older than 2 weeks". More options to be added on request.
 */
export class PrinterFileCleanTask {
  logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerCache: PrinterCache,
    private readonly printerFilesStore: PrinterFilesStore,
    private readonly settingsStore: SettingsStore,
  ) {
    this.logger = loggerFactory(PrinterFileCleanTask.name);
  }

  private get ageDaysMaxSetting() {
    return this.getSettings().autoRemoveOldFilesCriteriumDays;
  }

  async run() {
    const printers = await this.printerCache.listCachedPrinters(false);
    const fileCleanSettings = this.getSettings();
    const autoCleanAtBootEnabled = fileCleanSettings.autoRemoveOldFilesAtBoot;

    try {
      if (autoCleanAtBootEnabled) {
        this.logger.log(
          `Cleaning files of ${printers.length} active printers [printerFileClean:autoRemoveOldFilesAtBoot].`,
        );
      } else {
        this.logger.log(`Reporting about old files of ${printers.length} printers.`);
      }

      const errorPrinters = [];
      for (let printer of printers) {
        try {
          await this.printerFilesStore.loadFiles(printer.id);
        } catch (e) {
          errorPrinters.push({ e, printer });
        }
      }
      if (errorPrinters.length > 0) {
        this.logger.error(
          `Error loading some files, ${errorPrinters.length} printer(s) did not respond or returned an unexpected status code.`,
        );
      }

      // Filter printer states - cant clean unconnected OctoPrint instances
      for (let printer of printers) {
        const outdatedFiles = this.getPrinterOutdatedFiles(printer);
        if (!outdatedFiles?.length) continue;

        // Report
        this.logger.log(`Found ${outdatedFiles?.length} old files of printer`);

        if (autoCleanAtBootEnabled) {
          await this.cleanPrinterFiles(printer.id);
        }
      }
    } finally {
      this.logger.log(`Printer old file analysis job ended`);
    }
  }

  async cleanPrinterFiles(printerId: number) {
    await this.printerFilesStore.deleteOutdatedFiles(printerId, this.ageDaysMaxSetting);
    await this.printerFilesStore.loadFiles(printerId);
  }

  getPrinterOutdatedFiles(printer: PrinterDto) {
    const ageDaysMax = this.ageDaysMaxSetting;
    return this.printerFilesStore.getOutdatedFiles(printer.id, ageDaysMax);
  }

  private getSettings() {
    return this.settingsStore.getFileCleanSettings();
  }
}
