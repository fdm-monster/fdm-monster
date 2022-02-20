const { AppConstants } = require("../../../server.constants");
const { expectOkResponse } = require("../../extensions");

const printerRoute = AppConstants.apiRoute + "/printer";
const testApiKey = "fdmonsterfdmonsterfdmonsterfdmon";

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

module.exports = {
  createTestPrinter,
  testApiKey
};
