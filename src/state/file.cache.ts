import { ValidationException } from "@/exceptions/runtime.exceptions";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { FileDto } from "@/services/printer-api.interface";

export class FileCache {
  private readonly printerFileStorage = new Map<number, FileDto[]>();
  private totalFileCount = 0;

  private readonly logger: LoggerService;

  constructor(loggerFactory: ILoggerFactory) {
    this.logger = loggerFactory(FileCache.name);
  }

  cachePrinterFiles(printerId: number, files: FileDto[]) {
    if (!printerId) {
      throw new Error("File Cache cant get a null/undefined printer id");
    }
    this.printerFileStorage.set(printerId, files);
    this.updateCacheFileRefCount();
  }

  getPrinterFiles(printerId: number) {
    if (!printerId) {
      throw new Error("File Cache cant get a null/undefined printer id");
    }
    return this.printerFileStorage.get(printerId);
  }

  updateCacheFileRefCount() {
    let totalFiles = 0;
    for (const storage of this.printerFileStorage.values()) {
      totalFiles += storage?.length || 0;
    }

    if (totalFiles !== this.totalFileCount) {
      this.totalFileCount = totalFiles;
      this.logger.log(`Cache updated. ${this.totalFileCount} file storage references cached.`);
    }

    return totalFiles;
  }

  purgePrinterId(printerId: number) {
    if (!printerId) {
      throw new ValidationException("Parameter printerId was not provided.");
    }

    const fileStorage = this.printerFileStorage.get(printerId);

    if (!fileStorage) {
      this.logger.warn("Did not remove printer File Storage as it was not found");
      return;
    }

    this.printerFileStorage.delete(printerId);

    this.logger.log(`Purged printer file cache`);
  }

  purgeFile(printerId: number, filePath: string) {
    const files = this.getPrinterFiles(printerId);
    if (!files) return;

    const fileIndex = files.findIndex((f) => f.path === filePath);
    if (fileIndex === -1) {
      // We can always choose to throw - if we trust the cache consistency
      this.logger.warn(
        `A file removal was ordered but this file was not found in files cache for provided printer id`,
        filePath,
      );

      return this.logger.log("File was not found in cached printer fileList");
    }

    files.splice(fileIndex, 1);
    this.logger.log(`File was removed from cache`);
  }
}
