import { ValidationException } from "@/exceptions/runtime.exceptions";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IdType } from "@/shared.constants";

/**
 * A generic cache for file references, which will be abstracted in future to allow for proxy files and local files.
 */
export class FileCache {
  private printerFiles: Record<IdType, any[]> = {};
  private totalFileCount = 0;

  private logger: LoggerService;

  constructor({ loggerFactory }: { loggerFactory: ILoggerFactory }) {
    this.logger = loggerFactory(FileCache.name);
  }

  /**
   * Save a printer storage reference to cache
   */
  cachePrinterFileStorage(printerId: IdType, files: any[]) {
    this.cachePrinterFiles(printerId, files);
  }

  cachePrinterFiles(printerId: IdType, fileList: any[]) {
    if (!printerId) {
      throw new Error("File Cache cant get a null/undefined printer id");
    }
    this.printerFiles[printerId] = fileList;

    this.updateCacheFileRefCount();
  }

  getPrinterFiles(printerId: IdType) {
    if (!printerId) {
      throw new Error("File Cache cant get a null/undefined printer id");
    }

    return this.printerFiles[printerId] || [];
  }

  updateCacheFileRefCount() {
    let totalFiles = 0;
    for (const storage of Object.values(this.printerFiles)) {
      totalFiles += storage?.length || 0;
    }

    if (totalFiles !== this.totalFileCount) {
      this.totalFileCount = totalFiles;
      this.logger.log(`Cache updated. ${this.totalFileCount} file storage references cached.`);
    }

    return totalFiles;
  }

  purgePrinterId(printerId: IdType) {
    if (!printerId) {
      throw new ValidationException("Parameter printerId was not provided.");
    }

    const fileStorage = this.printerFiles[printerId];

    if (!fileStorage) {
      this.logger.warn("Did not remove printer File Storage as it was not found");
      return;
    }

    delete this.printerFiles[printerId];

    this.logger.log(`Purged printerId '${printerId}' file cache`);
  }

  purgeFile(printerId: IdType, filePath: string) {
    const fileList = this.getPrinterFiles(printerId);

    const fileIndex = fileList.findIndex((f) => f.path === filePath);
    if (fileIndex === -1) {
      // We can always choose to throw - if we trust the cache consistency
      this.logger.warn(
        `A file removal was ordered but this file was not found in files cache for printer Id ${printerId}`,
        filePath
      );

      return this.logger.log("File was not found in cached printer fileList");
    }

    fileList.splice(fileIndex, 1);
    this.logger.log(`File ${filePath} was removed`);
  }
}
