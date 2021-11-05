const Logger = require("../handlers/logger");
const History = require("../models/History");
const { durationToDates } = require("../utils/time.util");

class HistoryService {
  #octoPrintApiService;
  #settingsStore;

  #logger = new Logger("Server-HistoryCollection");

  constructor({ octoPrintApiService, settingsStore }) {
    this.#octoPrintApiService = octoPrintApiService;
    this.#settingsStore = settingsStore;
  }

  async find(limit = 100) {
    return History.find({}).sort({ historyIndex: -1 }).limit(limit);
  }

  async saveJobCompletion(printer, job, status = "success", { payload, resends }) {
    let printerName = printer.getName();
    const { startDate, endDate } = durationToDates(payload.time);

    const printHistory = {
      printerName,
      printerId: printer._id,
      costSettings: printer.costSettings,
      job,
      resends,
      success: payload.success,
      reason: payload.reason,
      fileName: payload.name,
      fileDisplay: payload.display,
      filePath: payload.path,
      startDate,
      endDate,
      printTime: payload.time
    };

    const newHistoryDoc = new History(printHistory);
    await newHistoryDoc.save();
    return newHistoryDoc;
  }
}

module.exports = HistoryService;
