const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const { createTestPrinter } = require("./test-data/create-printer");

const defaultRoute = `${AppConstants.apiRoute}/printer-profiles`;
const listRoute = (id) => `${defaultRoute}/${id}`;
const listCacheRoute = (id) => `${listRoute(id)}/cache`;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {});

describe("PrinterProfilesController", () => {
  it(`should allow GET on ${defaultRoute}`, async () => {
    const printer = await createTestPrinter(request);
    const response = await request.get(listRoute(printer.id)).send();
    expectOkResponse(response);
  });

  it(`should allow GET on ${defaultRoute} for /cache`, async () => {
    const printer = await createTestPrinter(request);
    const response = await request.get(listCacheRoute(printer.id)).send();
    expectOkResponse(response);
  });
});
