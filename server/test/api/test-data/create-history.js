const HistoryModel = require("../../../models/History");
const {
  EVENT_TYPES
} = require("../../../services/octoprint/constants/octoprint-websocket.constants");

async function createTestHistory(
  printerId,
  name,
  job = {
    test: true
  },
  payload = {},
  meta = {},
  octoPrintEventType = EVENT_TYPES.PrintDone
) {
  const history = new HistoryModel({
    printerName: name,
    printerId,
    job: job,
    payload,
    meta,
    octoPrintEventType
  });
  await history.validate();
  return history.save();
}

module.exports = {
  createTestHistory
};
