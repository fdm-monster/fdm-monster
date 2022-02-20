import Logger from "../handlers/logger.js";
/**
 * Generic store for synchronisation of files and storage information of printers.
 */
class FilesStore {
    #printersStore;
    #printerFilesService;
    #fileCache;
    #octoPrintApiService;
    #logger = new Logger("Server-FilesStore");
    constructor({ printersStore, printerFilesService, fileCache, octoPrintApiService }) {
        this.#printersStore = printersStore;
        this.#printerFilesService = printerFilesService;
        this.#fileCache = fileCache;
        this.#octoPrintApiService = octoPrintApiService;
    }
    /**
     * Load the file store by grabbing files from the service. TODO move files out of printer
     * @returns {Promise<void>}
     */
    async loadFilesStore() {
        const printers = this.#printersStore.listPrinterStates();
        for (let printer of printers) {
            try {
                const printerFileStorage = await this.#printerFilesService.getPrinterFilesStorage(printer.id);
                this.#fileCache.cachePrinterFileStorage(printer.id, printerFileStorage);
            }
            catch (e) {
                this.#logger.error("Files store failed to reconstruct files from database.", e.stack);
            }
        }
    }
    async getFiles(printerId) {
        // Might introduce a filter like folder later
        return this.#fileCache.getPrinterFiles(printerId);
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
        this.#logger.info("Clearing caches successful.");
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
        const printerFileList = await this.#printerFilesService.appendOrReplaceFile(printer.id, addedFile);
        // Update cache with data from storage
        await this.#fileCache.cachePrinterFiles(printer.id, printerFileList);
    }
    /**
     * Remove file reference from database and then cache.
     * @param printerId
     * @param filePath
     * @param throwError silence any missing file error if false
     * @returns {Promise<void>}
     */
    async deleteFile(printerId, filePath, throwError) {
        const serviceActionResult = await this.#printerFilesService.deleteFile(printerId, filePath, throwError);
        // Warning only
        const cacheActionResult = this.#fileCache.purgeFile(printerId, filePath);
        return { service: serviceActionResult, cache: cacheActionResult };
    }
}
export default FilesStore;
