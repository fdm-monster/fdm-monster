import { AppConstants } from "../../../server.constants";
import extensions from "../../extensions.js";
const { expectOkResponse } = extensions;
const printerRoute = AppConstants.apiRoute + "/printer";
const testApiKey = "3dhub3dhub3dhub3dhub3dhub3dhub3d";
async function createTestPrinter(request, groupName = "Row0_0") {
    const createResponse = await request.post(printerRoute).send({
        printerURL: "http://url.com",
        apiKey: testApiKey,
        enabled: false,
        group: groupName,
        settingsAppearance: {
            name: "testPrinter 123"
        }
    });
    return expectOkResponse(createResponse, { enabled: false });
}
export { createTestPrinter };
export { testApiKey };
export default {
    createTestPrinter,
    testApiKey
};
