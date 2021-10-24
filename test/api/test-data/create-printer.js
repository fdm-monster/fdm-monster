const { AppConstants } = require("../../../server/server.constants");
const { expectOkResponse } = require("../../extensions");

const printerRoute = AppConstants.apiRoute + "/printer";
const testApiKey = "3dhub3dhub3dhub3dhub3dhub3dhub3d";

async function createTestPrinter(request) {
  const createResponse = await request.post(printerRoute).send({
    printerURL: "http://url.com",
    apiKey: testApiKey,
    enabled: false,
    settingsAppearance: {
      name: "testPrinter 123"
    }
  });
  return expectOkResponse(createResponse, { enabled: false });
}

module.exports = {
  createTestPrinter,
  testApiKey
};
