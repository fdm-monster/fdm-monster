import HistoryModel from "../../../models/History.js";
import service from "../../../constants/service.constants";
const { getCostSettingsDefault } = service;
async function createTestHistory(printerId, name, costSettings = {}, job = {
    test: true
}) {
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
export { createTestHistory };
export default {
    createTestHistory
};
