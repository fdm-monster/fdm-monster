import { ValidationException } from "@/exceptions/runtime.exceptions";
import { PrinterCache } from "@/state/printer.cache";
import { FileCache } from "@/state/file.cache";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { captureException } from "@sentry/node";
import { PrinterApiFactory } from "@/services/printer-api.factory";

export class PrinterFilesStore {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerCache: PrinterCache,
    public readonly fileCache: FileCache,
    private readonly printerApiFactory: PrinterApiFactory,
  ) {
    this.logger = loggerFactory(PrinterFilesStore.name);
  }

  async loadFilesStore(): Promise<void> {
    const printers = await this.printerCache.listCachedPrinters(true);
    for (const printer of printers.filter(p => p.enabled)) {
      try {
        const printerFiles = await this.loadFiles(printer.id);
        this.fileCache.cachePrinterFiles(printer.id, printerFiles);
      } catch (e) {
        captureException(e);
        this.logger.error(`Files store failed to load file list for printer ${printer.name}`);
      }
    }
  }

  async loadFiles(printerId: number): Promise<any> {
    const loginDto = await this.printerCache.getLoginDtoAsync(printerId);
    const printerApi = this.printerApiFactory.getScopedPrinter(loginDto);
    const files = await printerApi.getFiles();
    this.fileCache.cachePrinterFiles(printerId, files);
    return files;
  }

  getFiles(printerId: number) {
    return this.fileCache.getPrinterFiles(printerId);
  }

  getOutdatedFiles(printerId: number, ageDaysMax: number) {
    if (!ageDaysMax) throw new ValidationException("ageDaysMax property is required to get printer's outdated files");
    const printerFiles = this.getFiles(printerId);
    if (!printerFiles?.length) return [];
    const nowTimestampSeconds = Date.now() / 1000;
    return printerFiles.filter((file) => !!file.date && file.date + ageDaysMax * 86400 < nowTimestampSeconds);
  }

  async deleteOutdatedFiles(printerId: number, ageDaysMax: number) {
    const printerApi = this.printerApiFactory.getById(printerId);

    const failedFiles = [];
    const succeededFiles = [];
    const nonRecursiveFiles = this.getOutdatedFiles(printerId, ageDaysMax);

    const name = (await this.printerCache.getCachedPrinterOrThrowAsync(printerId)).name;

    for (let file of nonRecursiveFiles) {
      try {
        await printerApi.deleteFile(file.path);
        succeededFiles.push(file);
      } catch (e) {
        failedFiles.push(file);
      }
    }

    this.logger.log(
      `Deleted ${succeededFiles.length} successfully and ${failedFiles.length} with failure for printer ${name}.`,
    );
    return {
      failedFiles,
      succeededFiles,
    };
  }

  async purgePrinterFiles(printerId: number) {
    const printerState = await this.printerCache.getCachedPrinterOrThrowAsync(printerId);

    this.logger.log(`Purging file cache from printer`);
    this.fileCache.purgePrinterId(printerState.id);
    this.logger.log(`Clearing printer files successful`);
  }

  async purgeFiles() {
    const allPrinters = await this.printerCache.listCachedPrinters();

    this.logger.log(`Clearing file caches`);
    for (let printer of allPrinters) {
      this.fileCache.purgePrinterId(printer.id);
    }
    this.logger.log(`Clearing caches successful.`);
  }

  async deleteFile(printerId: number, filePath: string) {
    this.fileCache.purgeFile(printerId, filePath);
  }
}
