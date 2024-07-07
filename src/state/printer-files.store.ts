import { ValidationException } from "@/exceptions/runtime.exceptions";
import { PrinterCache } from "@/state/printer.cache";
import { FileCache } from "@/state/file.cache";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { LoggerService } from "@/handlers/logger";
import { IdType } from "@/shared.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { errorSummary } from "@/utils/error.utils";
import { CreateOrUpdatePrinterFileDto, PrinterFileDto } from "@/services/interfaces/printer-file.dto";
import { captureException } from "@sentry/node";

export class PrinterFilesStore {
  printerCache: PrinterCache;
  fileCache: FileCache;
  octoprintClient: OctoprintClient;
  private logger: LoggerService;

  constructor({
    printerCache,
    fileCache,
    octoprintClient,
    loggerFactory,
  }: {
    printerCache: PrinterCache;
    fileCache: FileCache;
    octoprintClient: OctoprintClient;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerCache = printerCache;
    this.fileCache = fileCache;
    this.octoprintClient = octoprintClient;

    this.logger = loggerFactory(PrinterFilesStore.name);
  }

  async loadFilesStore(): Promise<void> {
    const printers = await this.printerCache.listCachedPrinters(true);
    for (const printer of printers) {
      try {
        const printerFiles = await this.loadFiles(printer.id, false);
        this.fileCache.cachePrinterFiles(printer.id, printerFiles);
      } catch (e) {
        captureException(e);
        this.logger.error("Files store failed to load file list for printer");
      }
    }
  }

  async loadFiles(printerId: IdType, recursive: boolean): Promise<any> {
    const loginDto = await this.printerCache.getLoginDtoAsync(printerId);
    const printerFiles = await this.octoprintClient.getLocalFiles(loginDto, recursive);
    this.fileCache.cachePrinterFiles(printerId, printerFiles);
    return printerFiles;
  }

  getFiles(printerId: IdType) {
    return this.fileCache.getPrinterFiles(printerId);
  }

  getOutdatedFiles(printerId: IdType, ageDaysMax: number) {
    if (!ageDaysMax) throw new ValidationException("ageDaysMax property is required to get printer's outdated files");
    const printerFiles = this.getFiles(printerId);
    if (!printerFiles?.length) return [];
    const nowTimestampSeconds = Date.now() / 1000;
    return printerFiles.filter((file) => !!file.date && file.date + ageDaysMax * 86400 < nowTimestampSeconds);
  }

  async deleteOutdatedFiles(printerId: IdType, ageDaysMax: number) {
    const failedFiles = [];
    const succeededFiles = [];

    const nonRecursiveFiles = this.getOutdatedFiles(printerId, ageDaysMax);
    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const name = (await this.printerCache.getCachedPrinterOrThrowAsync(printerId)).name;

    for (let file of nonRecursiveFiles) {
      try {
        await this.octoprintClient.deleteFileOrFolder(printerLogin, file.path);
        succeededFiles.push(file);
      } catch (e) {
        failedFiles.push(file);
      }
    }

    this.logger.log(`Deleted ${succeededFiles.length} successfully and ${failedFiles.length} with failure for printer ${name}.`);
    return {
      failedFiles,
      succeededFiles,
    };
  }

  async purgePrinterFiles(printerId: IdType) {
    const printerState = await this.printerCache.getCachedPrinterOrThrowAsync(printerId);

    this.logger.log(`Clearing file cache from printer`);
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

  async deleteFile(printerId: IdType, filePath: string, throwError: boolean) {
    this.fileCache.purgeFile(printerId, filePath);
  }
}
