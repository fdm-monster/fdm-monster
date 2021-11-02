const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");

const defaultRoute = `${AppConstants.apiRoute}/printer-network`;
const scanSsdpRoute = `${defaultRoute}/scan-ssdp`;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

describe("PrinterNetworkController", () => {
  it("should run scan ssdp", async () => {
    const response = await request.post(scanSsdpRoute).send();
    expectOkResponse(response);
  });
});
