const { findFileIndex } = require("../utils/find-predicate.utils");
const { ValidationException } = require("../exceptions/runtime.exceptions");
const { getFileListDefault } = require("../constants/service.constants");

/**
 * A generic cache for file references, which will be abstracted in future to allow for proxy files and local files.
 */
class FileCache {
  // Associative array
  #printerFileStorage = {}; // Ass. array [Id] : { fileList, storage }
  #totalFileCount = 0;

  #logger;

  constructor({ loggerFactory }) {
    this.#logger = loggerFactory("Server-FileCache");
  }

  /**
   * Save a printer storage reference to cache
   * @param printerId
   * @param fileList
   * @param storage
   */
  cachePrinterFileStorage(printerId, { fileList, storage }) {
    this.cachePrinterStorage(printerId, storage);

    this.cachePrinterFiles(printerId, fileList);
  }

  cachePrinterFiles(printerID, fileList) {
    const printerFileStorage = this.#getPrinterFileStorage(printerID);

    printerFileStorage.fileList = fileList;

    this.updateCacheFileRefCount();
  }

  cachePrinterStorage(printerId, storage) {
    const printerFileStorage = this.#getPrinterFileStorage(printerId);

    printerFileStorage.storage = storage;

    this.updateCacheFileRefCount();
  }

  #getPrinterFileStorage(printerId) {
    if (!printerId) {
      throw new Error("File Cache cant get a null/undefined printer id");
    }

    let fileStorage = this.#printerFileStorage[printerId];

    if (!fileStorage) {
      // A runtime thing only, repository handles it differently
      fileStorage = this.#printerFileStorage[printerId] = {
        fileList: getFileListDefault(),
        storage: undefined,
      };
    }

    return fileStorage;
  }

  getPrinterFiles(printerId) {
    const fileStorage = this.#getPrinterFileStorage(printerId);
    return fileStorage?.fileList;
  }

  getPrinterStorage(printerId) {
    const fileStorage = this.#getPrinterFileStorage(printerId);
    return fileStorage?.storage;
  }

  updateCacheFileRefCount() {
    let totalFiles = 0;
    for (const storage of Object.values(this.#printerFileStorage)) {
      totalFiles += storage.fileList.files?.length || 0;
    }

    if (totalFiles !== this.#totalFileCount) {
      this.#totalFileCount = totalFiles;
      this.#logger.log(`Cache updated. ${this.#totalFileCount} file storage references cached.`);
    }

    return totalFiles;
  }

  purgePrinterId(printerId) {
    if (!printerId) {
      throw new ValidationException("Parameter printerId was not provided.");
    }

    const fileStorage = this.#printerFileStorage[printerId];

    if (!fileStorage) {
      this.#logger.warn("Did not remove printer File Storage as it was not found");
      return;
    }

    delete this.#printerFileStorage[printerId];

    this.#logger.log(`Purged printerId '${printerId}' file cache`);
  }

  purgeFile(printerId, filePath) {
    const { fileList } = this.#getPrinterFileStorage(printerId);

    const fileIndex = findFileIndex(fileList, filePath);
    if (fileIndex === -1) {
      // We can always choose to throw - if we trust the cache consistency
      this.#logger.warn(
        `A file removal was ordered but this file was not found in files cache for printer Id ${printerId}`,
        filePath
      );

      return this.#logger.log("File was not found in cached printer fileList");
    }

    fileList.files.splice(fileIndex, 1);
    this.#logger.log(`File ${filePath} was removed`);
  }
}

module.exports = FileCache;
