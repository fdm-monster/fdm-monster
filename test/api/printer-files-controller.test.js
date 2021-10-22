jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const Printer = require("../../server/models/Printer");
const { createTestPrinter } = require("./test-data/create-printer");
const { expectOkResponse, expectInvalidResponse } = require("../extensions");

let request;
let configuredContainer;

const printerFilesRoute = AppConstants.apiRoute + "/printer-files";
const getRoute = (id) => `${printerFilesRoute}/${id}`;
const getCacheRoute = (id) => `${printerFilesRoute}/${id}/cache`;

beforeAll(async () => {
  await dbHandler.connect();
  let { server, container } = await setupTestApp(true);
  configuredContainer = container;

  request = supertest(server);
});

beforeEach(async () => {
  Printer.deleteMany({});
});

describe("PrinterFilesController", () => {
  it(`should return 404 on ${printerFilesRoute} for nonexisting printer`, async () => {
    const printerId = "60ae2b760bca4f5930be3d88";
    const path = getRoute(printerId);
    const res = await request.get(path).send();

    // Assert server failed
    expect(res.statusCode).toEqual(404);
  });

  it(`should require 'recursive' on ${printerFilesRoute} for existing printer`, async () => {
    const printer = await createTestPrinter(request);
    const path = getRoute(printer.id);
    const response = await request.get(path).send();

    // Assert server failed
    expectInvalidResponse(response, ["recursive"]);
  });

  it("should allow GET on printer files cache", async () => {
    const printer = await createTestPrinter(request);
    const path = getCacheRoute(printer.id);
    const response = await request.get(path).send();

    expectOkResponse(response);
  });
});
