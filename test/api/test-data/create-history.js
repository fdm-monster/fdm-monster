const HistoryModel = require("../../../server/models/History");

async function createTestHistory(printerId, name, costSettings = {}, job = {}) {
  const history = new HistoryModel({
    filePath: "test",
    fileDisplay: "Testfile",
    fileName: "testfilename",
    printTime: 123,
    success: true,
    reason: "Yay",
    job: job,
    costSettings: costSettings,
    printerId: printerId,
    printerName: name
  });
  return history.save();
}

module.exports = {
  createTestHistory
};
