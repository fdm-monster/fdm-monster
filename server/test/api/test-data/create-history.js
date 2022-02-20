const HistoryModel = require("../../../models/History");
const { getCostSettingsDefault } = require("../../../constants/service.constants");

async function createTestHistory(
  printerId,
  name,
  costSettings = {},
  job = {
    test: true
  }
) {
  const history = new HistoryModel({
    filePath: "test",
    fileDisplay: "Testfile",
    fileName: "testfilename",
    printTime: 123,
    success: true,
    reason: "Yay",
    job: job,
    costSettings: getCostSettingsDefault(),
    printerId: printerId,
    printerName: name
  });
  await history.validate();
  return history.save();
}

module.exports = {
  createTestHistory
};
