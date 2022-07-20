const { ValidationException } = require("../exceptions/runtime.exceptions");

/**
 * Generic store for synchronisation of files and storage information of printers.
 */
class FilesStore {
  #printersStore;
  #printerFilesService;
  #fileCache;
  #octoPrintApiService;

  #logger;

  constructor({
    printersStore,
    printerFilesService,
    fileCache,
    octoPrintApiService,
    loggerFactory
  }) {
    this.#printersStore = printersStore;
    this.#printerFilesService = printerFilesService;
    this.#fileCache = fileCache;
    this.#octoPrintApiService = octoPrintApiService;

    this.#logger = loggerFactory("Server-FilesStore");
  }

  /**
   * Load the file store by grabbing files from the service. TODO move files out of printer
   * @returns {Promise<void>}
   */
  async loadFilesStore() {
    const printers = this.#printersStore.listPrinterStates();
    for (let printer of printers) {
      try {
        const printerFileStorage = await this.#printerFilesService.getPrinterFilesStorage(
          printer.id
        );
        this.#fileCache.cachePrinterFileStorage(printer.id, printerFileStorage);
      } catch (e) {
        this.#logger.error("Files store failed to reconstruct files from database.", e.stack);
      }
    }
  }

  /**
   * Performs an OctoPrint call and updates both cache and database
   * @param printerId
   * @param recursive
   * @returns {Promise<*>}
   */
  async eagerLoadPrinterFiles(printerId, recursive) {
    const printer = this.#printersStore.getPrinterState(printerId);
    const printerLogin = printer.getLoginDetails();
    const response = await this.#octoPrintApiService.getFiles(printerLogin, recursive, {
      unwrap: false,
      simple: true
    });

    await this.updatePrinterFiles(printerId, response.data);

    return response;
  }

  getFiles(printerId) {
    // Might introduce a filter like folder later
    return this.#fileCache.getPrinterFiles(printerId);
  }

  getOutdatedFiles(printerId, ageDaysMax) {
    if (!ageDaysMax)
      throw new ValidationException(
        "ageDaysMax property is required to get printer's outdated files"
      );
    const printerFiles = this.getFiles(printerId);
    if (!printerFiles?.files?.length) return [];
    const nowTimestampSeconds = Date.now() / 1000;
    return printerFiles.files.filter(
      (file) => !!file.date && file.date + ageDaysMax * 86400 < nowTimestampSeconds
    );
  }

  async deleteOutdatedFiles(printerId, ageDaysMax) {
    const failedFiles = [];
    const succeededFiles = [];

    const nonRecursiveFiles = this.getOutdatedFiles(printerId, ageDaysMax);
    const printerLogin = this.#printersStore.getPrinterLogin(printerId);
    const printerName = this.#printersStore.getPrinterState(printerId).getName();

    for (let file of nonRecursiveFiles) {
      try {
        await this.#octoPrintApiService.deleteFileOrFolder(printerLogin, file.path);
        succeededFiles.push(file);
      } catch (e) {
        failedFiles.push(file);
      }
    }

    this.#logger.info(
      `Deleted ${succeededFiles.length} successfully and ${failedFiles.length} with failure for printer ${printerName}.`
    );
    return {
      failedFiles,
      succeededFiles
    };
  }

  async purgePrinterFiles(printerId) {
    const printerState = this.#printersStore.getPrinterState(printerId);

    this.#logger.info(`Purging files from printer ${printerId}`);
    await this.#printerFilesService.clearFiles(printerState.id);

    this.#logger.info(`Purging file cache from printer ${printerId}`);
    this.#fileCache.purgePrinterId(printerState.id);

    this.#logger.info(`Clearing printer files successful.`);
  }

  async purgeFiles() {
    const allPrinters = this.#printersStore.listPrinterStates(true);

    this.#logger.info(`Purging files from ${allPrinters.length} printers`);
    for (let printer of allPrinters) {
      await this.#printerFilesService.clearFiles(printer.id);
    }

    this.#logger.info(`Purging files done. Clearing caches`);
    for (let printer of allPrinters) {
      this.#fileCache.purgePrinterId(printer.id);
    }
    this.#logger.info(`Clearing caches successful.`);
  }

  async updatePrinterFiles(printerId, files) {
    const printer = this.#printersStore.getPrinterState(printerId);

    // Check printer in database and modify
    const printerFileList = await this.#printerFilesService.updateFiles(printer.id, files);

    // Update cache with data from storage
    await this.#fileCache.cachePrinterFiles(printer.id, printerFileList);
  }

  async appendOrSetPrinterFile(printerId, addedFile) {
    const printer = this.#printersStore.getPrinterState(printerId);

    // Check printer in database and modify
    const { fileList, lastPrintedFile } = await this.#printerFilesService.appendOrReplaceFile(
      printer.id,
      addedFile
    );

    // Update cache with data from storage
    await this.#fileCache.cachePrinterFiles(printer.id, fileList);

    // Update printer state with lastPrintedFile
    printer.updateLastPrintedFile(lastPrintedFile);
  }

  async setExistingFileForPrint(printerId, filePath) {
    const printer = this.#printersStore.getPrinterState(printerId);

    const lastPrintedFile = await this.#printerFilesService.setPrinterLastPrintedFile(
      printerId,
      filePath
    );

    // Update printer state with lastPrintedFile
    printer.updateLastPrintedFile(lastPrintedFile);
  }

  /**
   * Remove file reference from database and then cache.
   * @param printerId
   * @param filePath
   * @param throwError silence any missing file error if false
   * @returns {Promise<{cache: ((*&{success: boolean, message})|(*&{success: boolean, message})), service: *}>}
   */
  async deleteFile(printerId, filePath, throwError) {
    const serviceActionResult = await this.#printerFilesService.deleteFile(
      printerId,
      filePath,
      throwError
    );

    // Warning only
    const cacheActionResult = this.#fileCache.purgeFile(printerId, filePath);

    return { service: serviceActionResult, cache: cacheActionResult };
  }
}

module.exports = FilesStore;
