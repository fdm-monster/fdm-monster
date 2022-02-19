const { AppConstants } = require("../../../server.constants");
const { expectOkResponse } = require("../../extensions");

const printerGroupRoute = AppConstants.apiRoute + "/printer-group";

async function createTestPrinterGroup(request) {
  const createResponse = await request.post(printerGroupRoute).send({
    name: "Group0_0",
    location: {
      x: -1,
      y: -1
    },
    printers: []
  });
  return expectOkResponse(createResponse, {
    location: { x: -1, y: -1 },
    printers: expect.any(Array)
  });
}

module.exports = {
  createTestPrinterGroup
};
