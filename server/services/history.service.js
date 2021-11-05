const HistoryModel = require("../models/History");
const { durationToDates } = require("../utils/time.util");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { Status } = require("../constants/service.constants");

class HistoryService {
  #octoPrintApiService;
  #settingsStore;

  #logger;

  constructor({ octoPrintApiService, settingsStore, loggerFactory }) {
    this.#octoPrintApiService = octoPrintApiService;
    this.#settingsStore = settingsStore;
    this.#logger = loggerFactory(HistoryService.name);
  }

  async find(limit = 100) {
    return HistoryModel.find({}).sort({ historyIndex: -1 }).limit(limit);
  }

  async get(id) {
    const history = await HistoryModel.findById(id);
    if (!history) throw new NotFoundException(`The history entry by id ${id} was not found.`);
    return history;
  }

  async delete(id) {
    const history = await this.get(id);
    await HistoryModel.findByIdAndDelete(history.id);

    return Status.success("History entry was removed");
  }

  async updateCostSettings(id, costSettings) {
    const historyDoc = await this.get(id);
    historyDoc.costSettings = costSettings;
    await historyDoc.save();

    return historyDoc;
  }

  async create(printer, job, { payload, resends }) {
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

    const newHistoryDoc = new HistoryModel(printHistory);
    await newHistoryDoc.save();
    return newHistoryDoc;
  }
}

module.exports = HistoryService;
