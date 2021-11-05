const { getDefaultHistoryStatistics } = require("../constants/cleaner.constants");
const { arrayCounts } = require("../utils/array.util");
const { sumValuesGroupByDate, assignYCumSum } = require("../utils/graph-point.utils");
const { getPrintCostNumeric } = require("../utils/print-cost.util");
const { Status } = require("../constants/service.constants");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

/**
 * A standalone store as in-memory layer for the underlying history service
 */
class HistoryStore {
  #generatedStatistics = getDefaultHistoryStatistics();
  #historyCache = [];

  #enableLogging = false;
  #logger;

  #historyService;
  #settingsStore;
  #printersStore;
  #jobsCache;

  constructor({ historyService, jobsCache, printersStore, settingsStore, loggerFactory }) {
    this.#historyService = historyService;
    this.#settingsStore = settingsStore;
    this.#printersStore = printersStore;
    this.#jobsCache = jobsCache;
    this.#logger = loggerFactory(HistoryStore.name, this.#enableLogging, "warn");
  }

  getHistoryCache() {
    return {
      history: this.#historyCache,
      stats: this.#generatedStatistics
    };
  }

  getEntryIndex(id) {
    const entryIndex = this.#historyCache.findIndex((h) => h.id === id);
    if (entryIndex === -1) throw new NotFoundException("History entry not found in cache");

    return entryIndex;
  }

  getEntry(id) {
    const entry = this.#historyCache.find((h) => h.id === id);
    if (!entry) throw new NotFoundException("History entry not found in cache");

    return entry;
  }

  async createJobHistoryEntry(printerId, { payload, resends }) {
    const job = this.#jobsCache.getPrinterJob(printerId);
    const printerState = this.#printersStore.getPrinterState(printerId);

    const entry = await this.#historyService.create(printerState, job, { payload, resends });
    this.#historyCache.push(entry);

    return entry;
  }

  async updateCostSettings(id, costSettings) {
    const entryIndex = this.getEntryIndex(id);
    const historyEntry = await this.#historyService.updateCostSettings(id, costSettings);

    this.#historyCache[entryIndex] = historyEntry;
    return historyEntry;
  }

  async deleteEntry(id) {
    await this.#historyService.delete(id);

    const index = this.getEntryIndex(id);
    if (index !== -1) {
      this.#historyCache.pop(index);

      return Status.success("Deleted history entry from cached history");
    } else {
      return Status.failure("History entry was not found in cached history");
    }
  }

  /**
   * Set the initial state for the history cache
   * @returns {Promise<void>}
   */
  async loadHistoryStore() {
    const storedHistory = await this.#historyService.find(100);
    const historyEntities = storedHistory ?? [];

    const historyArray = [];
    for (let printHistory of historyEntities) {
      printHistory.printCost = getPrintCostNumeric(
        printHistory.printTime,
        printHistory.costSettings
      );
      historyArray.push(printHistory);
    }

    this.#historyCache = historyArray;
    this.#generatedStatistics = this.generateStatistics();
  }

  generateStatistics() {
    let completedJobsCount = 0;
    let cancelledCount = 0;
    let failedCount = 0;
    const printTimes = [];
    const fileNames = [];
    const printerNames = [];
    const printCostArray = [];
    const filamentCost = [];
    const failedPrintTime = [];

    const usageOverTime = [];
    const totalByDay = [];
    const historyByDay = [];

    for (let h = 0; h < this.#historyCache.length; h++) {
      const { printCost, fileName, success, reason, printTime, printerName, spoolCost } =
        this.#historyCache[h];

      if (success) {
        completedJobsCount++;
        printTimes.push(printTime);
        fileNames.push(fileName);
        printerNames.push(printerName);
        printCostArray.push(parseFloat(printCost));
      } else if (reason === "cancelled") {
        cancelledCount++;
        failedPrintTime.push(printTime);
      } else {
        failedCount++;
        failedPrintTime.push(printTime);
      }
      filamentCost.push(spoolCost);
    }

    const filesArray = arrayCounts(fileNames);
    let mostPrintedFile = "No Files";
    if (filesArray[0].length !== 0) {
      const countFilesArray = filesArray[1].indexOf(Math.max(...filesArray[1]));
      mostPrintedFile = filesArray[0][countFilesArray];
      mostPrintedFile = mostPrintedFile.replace(/_/g, " ");
    }
    const printerNamesArray = arrayCounts(printerNames);
    let mostUsedPrinter = "No Printers";
    let leastUsedPrinter = "No Printers";
    if (printerNamesArray[0].length !== 0) {
      const maxIndexPrinterNames = printerNamesArray[1].indexOf(Math.max(...printerNamesArray[1]));
      const minIndexPrinterNames = printerNamesArray[1].indexOf(Math.min(...printerNamesArray[1]));
      mostUsedPrinter = printerNamesArray[0][maxIndexPrinterNames];
      leastUsedPrinter = printerNamesArray[0][minIndexPrinterNames];
    }
    totalByDay.forEach((usage) => {
      usage.data = sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = assignYCumSum(usage.data);
    });
    historyByDay.forEach((usage) => {
      usage.data = sumValuesGroupByDate(usage.data);
    });

    return {
      completed: completedJobsCount,
      cancelled: cancelledCount,
      failed: failedCount,
      longestPrintTime: Math.max(...printTimes),
      shortestPrintTime: Math.min(...printTimes),
      averagePrintTime: printTimes.reduce((a, b) => a + b, 0) / printTimes.length,
      mostPrintedFile,
      printerMost: mostUsedPrinter,
      printerLeast: leastUsedPrinter,
      totalFilamentCost: filamentCost.reduce((a, b) => a + b, 0),
      highestFilamentCost: Math.max(...filamentCost),
      totalPrintCost: printCostArray.reduce((a, b) => a + b, 0),
      highestPrintCost: Math.max(...printCostArray),
      currentFailed: failedPrintTime.reduce((a, b) => a + b, 0),
      totalByDay: totalByDay,
      usageOverTime: usageOverTime,
      historyByDay: historyByDay
    };
  }
}

module.exports = HistoryStore;
