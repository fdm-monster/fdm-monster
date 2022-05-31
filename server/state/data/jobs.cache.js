const _ = require("lodash");
const Logger = require("../../handlers/logger.js");
const { getJobCacheDefault } = require("../../constants/cache.constants");
const { ValidationException } = require("../../exceptions/runtime.exceptions");

/**
 * Stores a delegate job progress state for each printer - making it easier to access the latest job state.
 * No need to initialize as this is done by the printer states in a safe manner.
 */
class JobsCache {
  // associative array per printer ID
  #cachedJobProgress = {};

  #eventEmitter2;

  #logger = new Logger("Jobs-Cache");

  constructor({ eventEmitter2 }) {
    this.#eventEmitter2 = eventEmitter2;
  }

  getPrinterJob(printerId) {
    if (!printerId) {
      throw new Error("Job Cache cant get a null/undefined printer id");
    }

    let cachedPrinterJob = this.#cachedJobProgress[printerId];
    if (!cachedPrinterJob) {
      this.#cachedJobProgress[printerId] = getJobCacheDefault();
    }

    return this.#cachedJobProgress[printerId];
  }

  jobExists(id) {
    return !!this.#cachedJobProgress.hasOwnProperty(id);
  }

  purgePrinterId(printerId) {
    if (!printerId) {
      throw new ValidationException("Parameter printerId was not provided.");
    }

    const jobCacheEntry = this.#cachedJobProgress[printerId];

    if (!jobCacheEntry) {
      this.#logger.warning("Did not remove printer Job Progress as it was not found");
      return;
    }

    delete this.#cachedJobProgress[printerId];

    this.#logger.info(`Purged printerId '${printerId}' job progress cache`);
  }

  /**
   * By calling the job is supposed to exist, so the requestor must be certain this job exists.
   * This will crash if not the case, so call jobExists(id) to check beforehand.
   * @param id
   * @returns {{fileName, lastPrintTime, fileDisplay, filePath, averagePrintTime, expectedPrintTime: any}}
   */
  getPrinterJobFlat(id) {
    const cachedJob = this.#cachedJobProgress[id];

    if (!cachedJob) {
      // Problematic scenario where websocket is not set-up yet. Requestor should be more wary of that and be tolerant against
      // Empty job
      return;
    }

    // Shape it into client compatible format
    const transformedJob = {
      fileName: cachedJob.job.file.name || "No file selected",
      fileDisplay: cachedJob.job.file.display || "No file selected",
      filePath: cachedJob.job.file.path,
      averagePrintTime: cachedJob.job.averagePrintTime,
      lastPrintTime: cachedJob.job.lastPrintTime,
      estimatedPrintTime: cachedJob.job.estimatedPrintTime // Rename?
    };
    if (!!cachedJob.currentZ) {
      transformedJob.currentZ = cachedJob.currentZ;
    }

    const progress = cachedJob.progress;
    if (!!progress) {
      transformedJob.progress = progress.completion;
      transformedJob.printTimeLeft = progress.printTimeLeft; // Rename
      transformedJob.printTimeElapsed = progress.printTime; // Rename
    } else {
      transformedJob.progress = 0;
    }

    return transformedJob;
  }

  savePrinterJob(id, data) {
    let cachedPrinterJob = this.#cachedJobProgress[id];
    if (!cachedPrinterJob) {
      this.#cachedJobProgress[id] = getJobCacheDefault();
    }

    this.updatePrinterJob(id, data);
  }

  updatePrinterJob(id, data) {
    let cachedPrinterJob = this.#cachedJobProgress[id];
    if (!cachedPrinterJob) {
      throw new Error(`this printer ID ${id} is not known. Cant update printer job cache.`);
    }

    cachedPrinterJob.job = data.job;
    cachedPrinterJob.progress = data.progress;
    cachedPrinterJob.currentZ = data.currentZ;

    this.#cachedJobProgress[id] = cachedPrinterJob;
  }
}

module.exports = JobsCache;
