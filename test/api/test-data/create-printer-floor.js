const { AppConstants } = require("../../../server.constants");
const { expectOkResponse } = require("../../extensions");

const floorRoute = AppConstants.apiRoute + "/floor";

async function createTestFloor(request, name = "Floor101", floorNumber = 1) {
  const createResponse = await request.post(floorRoute).send({
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
  createTestFloor,
  floorRoute,
};
