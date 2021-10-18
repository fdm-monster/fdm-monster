jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const Printer = require("../../server/models/Printer");
const { createTestPrinter } = require("./test-data/create-printer");

let request;

const printerFilesRoute = AppConstants.apiRoute + "/printer-files";
const getRoute = (id) => `${printerFilesRoute}/${id}`;
const getCacheRoute = (id) => `${printerFilesRoute}/${id}/cache`;

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  request = supertest(server);
});

beforeEach(async () => {
  Printer.deleteMany({});
});

describe("PrinterFilesController", () => {
  it(`should not allow GET on ${printerFilesRoute} for nonexisting printer`, async () => {
    const printerId = "60ae2b760bca4f5930be3d88";
    const path = getRoute(printerId);
    const res = await request.post(path).send();

    // Assert server failed
    expect(res.statusCode).toEqual(404);
  });

  it(`should not allow GET on ${printerFilesRoute}`, async () => {
    const path = getRoute(printerFilesRoute);
    const res = await request.post(path).send();

    // Assert server failed
    expect(res.statusCode).toEqual(404);
  });

  it("should allow GET on printer files cache", async () => {
    const printer = await createTestPrinter(request);
    const path = getCacheRoute(printer.id);
    const res = await request.get(path).send();

    // Assert server failed
    expect(res.statusCode).toEqual(200);
  });
});
