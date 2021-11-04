const HistoryModel = require("../../../server/models/History");

async function createTestHistory() {
  const history = new HistoryModel({
    printHistory: {}
  });
  return history.save();
}

module.exports = {
  createTestHistory
};
