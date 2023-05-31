const { AppConstants } = require("../../../server.constants");
const { expectOkResponse } = require("../../extensions");

const printerRoute = AppConstants.apiRoute + "/printer";
const testApiKey = "fdmonsterfdmonsterfdmonsterfdmon";

async function createTestPrinter(request, enabled = false) {
  const createResponse = await request.post(printerRoute).send({
    printerURL: "http://url.com",
    apiKey: testApiKey,
    enabled,
    settingsAppearance: {
      name: "testPrinter 123",
    },
  });
  return expectOkResponse(createResponse, { enabled });
}

module.exports = {
  createTestPrinter,
  testApiKey,
};
