import { findFileIndex } from "@/utils/find-predicate.utils";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { getFileListDefault } from "@/constants/service.constants";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IdType } from "@/shared.constants";

/**
 * A generic cache for file references, which will be abstracted in future to allow for proxy files and local files.
 */
export class FileCache {
  private printerFileStorage = {};
  private totalFileCount = 0;

  private logger: LoggerService;

  constructor({ loggerFactory }: { loggerFactory: ILoggerFactory }) {
    this.logger = loggerFactory(FileCache.name);
  }

  /**
   * Save a printer storage reference to cache
   * @param printerId
   * @param fileList
   * @param storage
   */
  cachePrinterFileStorage(printerId: IdType, { fileList, storage }) {
    this.cachePrinterStorage(printerId, storage);

    this.cachePrinterFiles(printerId, fileList);
  }

  cachePrinterFiles(printerId: IdType, fileList) {
    const printerFileStorage = this.getPrinterFileStorage(printerId);

    printerFileStorage.fileList = fileList;

    this.updateCacheFileRefCount();
  }

  cachePrinterStorage(printerId: IdType, storage) {
    const printerFileStorage = this.getPrinterFileStorage(printerId);

    printerFileStorage.storage = storage;

    this.updateCacheFileRefCount();
  }

  private getPrinterFileStorage(printerId: IdType) {
    if (!printerId) {
      throw new Error("File Cache cant get a null/undefined printer id");
    }

    let fileStorage = this.printerFileStorage[printerId];

    if (!fileStorage) {
      // A runtime thing only, repository handles it differently
      fileStorage = this.printerFileStorage[printerId] = {
        fileList: getFileListDefault(),
        storage: undefined,
      };
    }

    return fileStorage;
  }

  getPrinterFiles(printerId: IdType) {
    const fileStorage = this.getPrinterFileStorage(printerId);
    return fileStorage?.fileList;
  }

  getPrinterStorage(printerId: IdType) {
    const fileStorage = this.getPrinterFileStorage(printerId);
    return fileStorage?.storage;
  }

  updateCacheFileRefCount() {
    let totalFiles = 0;
    for (const storage of Object.values(this.printerFileStorage)) {
      totalFiles += storage.fileList?.files?.length || 0;
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

    const fileStorage = this.printerFileStorage[printerId];

    if (!fileStorage) {
      this.logger.warn("Did not remove printer File Storage as it was not found");
      return;
    }

    delete this.printerFileStorage[printerId];

    this.logger.log(`Purged printerId '${printerId}' file cache`);
  }

  purgeFile(printerId: IdType, filePath: string) {
    const { fileList } = this.getPrinterFileStorage(printerId);

    const fileIndex = findFileIndex(fileList, filePath);
    if (fileIndex === -1) {
      // We can always choose to throw - if we trust the cache consistency
      this.logger.warn(
        `A file removal was ordered but this file was not found in files cache for printer Id ${printerId}`,
        filePath
      );

      return this.logger.log("File was not found in cached printer fileList");
    }

    fileList.files.splice(fileIndex, 1);
    this.logger.log(`File ${filePath} was removed`);
  }
}
