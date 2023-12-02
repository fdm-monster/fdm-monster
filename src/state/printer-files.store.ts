import { ValidationException } from "@/exceptions/runtime.exceptions";
import { PrinterCache } from "@/state/printer.cache";
import { FileCache } from "@/state/file.cache";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { LoggerService } from "@/handlers/logger";
import { IdType } from "@/shared.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IPrinterFilesService } from "@/services/interfaces/printer-files.service.interface";

export class PrinterFilesStore {
  printerCache: PrinterCache;
  printerFilesService: IPrinterFilesService;
  fileCache: FileCache;
  octoPrintApiService: OctoPrintApiService;
  private logger: LoggerService;

  constructor({
    printerCache,
    printerFilesService,
    fileCache,
    octoPrintApiService,
    loggerFactory,
  }: {
    printerCache: PrinterCache;
    printerFilesService: IPrinterFilesService;
    fileCache: FileCache;
    octoPrintApiService: OctoPrintApiService;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerCache = printerCache;
    this.printerFilesService = printerFilesService;
    this.fileCache = fileCache;
    this.octoPrintApiService = octoPrintApiService;

    this.logger = loggerFactory(PrinterFilesStore.name);
  }

  /**
   * Load the file store by grabbing files from the service. TODO move files out of printer
   */
  async loadFilesStore(): Promise<void> {
    const printers = await this.printerCache.listCachedPrinters(true);
    for (let printer of printers) {
      try {
        const printerFileStorage = await this.printerFilesService.getPrinterFiles(printer.id);
        this.fileCache.cachePrinterFileStorage(printer.id, printerFileStorage);
      } catch (e) {
        this.logger.error("Files store failed to reconstruct files from database.", e.stack);
      }
    }
  }

  /**
   * Performs an OctoPrint call and updates both cache and database
   */
  async eagerLoadPrinterFiles(printerId: IdType, recursive: boolean): Promise<any> {
    const loginDto = await this.printerCache.getLoginDtoAsync(printerId);
    const response = await this.octoPrintApiService.getFiles(loginDto, recursive);

    await this.updatePrinterFiles(printerId, response);
    return response;
  }

  getFiles(printerId: IdType) {
    // Might introduce a filter like folder later
    return this.fileCache.getPrinterFiles(printerId);
  }

  getOutdatedFiles(printerId: IdType, ageDaysMax: number) {
    if (!ageDaysMax) throw new ValidationException("ageDaysMax property is required to get printer's outdated files");
    const printerFiles = this.getFiles(printerId);
    if (!printerFiles?.files?.length) return [];
    const nowTimestampSeconds = Date.now() / 1000;
    return printerFiles.files.filter((file) => !!file.date && file.date + ageDaysMax * 86400 < nowTimestampSeconds);
  }

  async deleteOutdatedFiles(printerId: IdType, ageDaysMax: number) {
    const failedFiles = [];
    const succeededFiles = [];

    const nonRecursiveFiles = this.getOutdatedFiles(printerId, ageDaysMax);
    const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
    const name = (await this.printerCache.getCachedPrinterOrThrowAsync(printerId)).name;

    for (let file of nonRecursiveFiles) {
      try {
        await this.octoPrintApiService.deleteFileOrFolder(printerLogin, file.path);
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

    this.logger.log(`Purging files from printer ${printerId}`);
    await this.printerFilesService.clearFiles(printerState.id);

    this.logger.log(`Purging file cache from printer ${printerId}`);
    this.fileCache.purgePrinterId(printerState.id);

    this.logger.log(`Clearing printer files successful.`);
  }

  async purgeFiles() {
    const allPrinters = await this.printerCache.listCachedPrinters();

    this.logger.log(`Purging files from ${allPrinters.length} printers`);
    for (let printer of allPrinters) {
      await this.printerFilesService.clearFiles(printer.id);
    }

    this.logger.log(`Purging files done. Clearing caches`);
    for (let printer of allPrinters) {
      this.fileCache.purgePrinterId(printer.id);
    }
    this.logger.log(`Clearing caches successful.`);
  }

  async updatePrinterFiles(printerId: IdType, files) {
    const printer = await this.printerCache.getCachedPrinterOrThrowAsync(printerId);

    // Check printer in database and modify
    const printerFileList = await this.printerFilesService.updateFiles(printer.id, files);

    // Update cache with data from storage
    await this.fileCache.cachePrinterFiles(printer.id, printerFileList);
  }

  async appendOrSetPrinterFile(printerId: IdType, addedFile) {
    const printer = await this.printerCache.getCachedPrinterOrThrowAsync(printerId);

    // Check printer in database and modify
    const { fileList } = await this.printerFilesService.appendOrReplaceFile(printer.id, addedFile);

    // Update cache with data from storage
    await this.fileCache.cachePrinterFiles(printer.id, fileList);
  }

  async deleteFile(
    printerId: IdType,
    filePath: string,
    throwError: boolean
  ): Promise<{
    service: any;
  }> {
    const serviceActionResult = await this.printerFilesService.deleteFile(printerId, filePath, throwError);

    // Warning only
    this.fileCache.purgeFile(printerId, filePath);
    return { service: serviceActionResult };
  }
}
