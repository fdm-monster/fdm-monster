const { AppConstants } = require("../../../server.constants");
const { expectOkResponse } = require("../../extensions");

const printerFloorRoute = AppConstants.apiRoute + "/printer-floor";

async function createTestPrinterFloor(request, name = "Floor101") {
  const createResponse = await request.post(printerFloorRoute).send({
    name,
    printerGroups: []
  });
  return expectOkResponse(createResponse, {
    name,
    printerGroups: expect.any(Array)
  });
}

module.exports = {
  createTestPrinterFloor
};
