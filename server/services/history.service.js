const HistoryModel = require("../models/History");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { EVENT_TYPES } = require("./octoprint/constants/octoprint-websocket.constants");

class HistoryService {
  #octoPrintApiService;
  #settingsStore;

  #logger;

  constructor({ octoPrintApiService, settingsStore, loggerFactory }) {
    this.#octoPrintApiService = octoPrintApiService;
    this.#settingsStore = settingsStore;
    this.#logger = loggerFactory("HistoryService");
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
  }

  async create(printerState, job, payload, resends, eventType = EVENT_TYPES.PrintDone) {
    const printHistory = {
      printerName: printerState.getName(),
      printerId: printerState.id,
      job,
      payload,
      meta: {
        resends,
        metaVersion: 1.0,
        registeredAt: Date.now()
      },
      octoPrintEventType: eventType
    };

    const newHistoryDoc = new HistoryModel(printHistory);
    await newHistoryDoc.save();
    return newHistoryDoc;
  }
}

module.exports = HistoryService;
