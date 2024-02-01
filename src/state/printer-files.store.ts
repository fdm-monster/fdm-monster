import { ValidationException } from "@/exceptions/runtime.exceptions";
import { PrinterCache } from "@/state/printer.cache";
import { FileCache } from "@/state/file.cache";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { LoggerService } from "@/handlers/logger";
import { IdType } from "@/shared.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IPrinterFilesService } from "@/services/interfaces/printer-files.service.interface";
import { errorSummary } from "@/utils/error.utils";
import { CreateOrUpdatePrinterFileDto, PrinterFileDto } from "@/services/interfaces/printer-file.dto";

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

  async loadFilesStore(): Promise<void> {
    const printers = await this.printerCache.listCachedPrinters(true);
    for (let printer of printers) {
      try {
        const printerFiles = await this.printerFilesService.getPrinterFiles(printer.id);
        this.fileCache.cachePrinterFiles(printer.id, printerFiles);
      } catch (e) {
        this.logger.error("Files store failed to reconstruct files from database.", errorSummary(e));
      }
    }
  }

  async eagerLoadPrinterFiles(printerId: IdType, recursive: boolean): Promise<any> {
    const loginDto = await this.printerCache.getLoginDtoAsync(printerId);
    const normalizedFiles = await this.octoPrintApiService.getLocalFiles(loginDto, recursive);
    await this.updatePrinterFiles(printerId, normalizedFiles);
    return normalizedFiles;
  }

  getFiles(printerId: IdType) {
    // Might introduce a filter like folder later
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

  async updatePrinterFiles(printerId: IdType, files: CreateOrUpdatePrinterFileDto[]) {
    const printer = await this.printerCache.getCachedPrinterOrThrowAsync(printerId);
    const printerFileList = await this.printerFilesService.updateFiles(printer.id, files);
    await this.fileCache.cachePrinterFiles(printer.id, printerFileList);
  }

  async appendOrSetPrinterFile(printerId: IdType, addedFile: PrinterFileDto) {
    const printer = await this.printerCache.getCachedPrinterOrThrowAsync(printerId);

    // TODO this is probably the erroneous batch reprint cause
    const files = await this.printerFilesService.appendOrReplaceFile(printer.id, addedFile);
    await this.fileCache.cachePrinterFiles(printer.id, files);
  }

  async deleteFile(
    printerId: IdType,
    filePath: string,
    throwError: boolean
  ): Promise<{
    service: any;
  }> {
    const serviceActionResult = await this.printerFilesService.deletePrinterFiles(printerId, [filePath], throwError);

    // Warning only
    this.fileCache.purgeFile(printerId, filePath);
    return { service: serviceActionResult };
  }
}
