const { AppConstants } = require("../../../server.constants");
const { expectOkResponse } = require("../../extensions");

const printerFloorRoute = AppConstants.apiRoute + "/printer-floor";

async function createTestPrinterFloor(request, name = "Floor101", floorNumber = 1) {
  const createResponse = await request.post(printerFloorRoute).send({
    name,
    floor: floorNumber,
    printers: [],
  });
  return expectOkResponse(createResponse, {
    name,
    printers: expect.any(Array),
  });
}

module.exports = {
  createTestPrinterFloor,
  printerFloorRoute,
};
