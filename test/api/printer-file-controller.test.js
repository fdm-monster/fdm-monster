jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const Printer = require("../../server/models/Printer");

let request;

const printerFilesRoute = AppConstants.apiRoute + "/printer-files";
const getRoute = (id) => `${printerFilesRoute}/${id}`;

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
    const res = await request.post(path).send(path);

    // Assert server failed
    expect(res.statusCode).toEqual(404);
  });

  it(`should not allow GET on ${printerFilesRoute}`, async () => {
    const path = getRoute(printerFilesRoute);
    const res = await request.post(path).send(path);

    // Assert server failed
    expect(res.statusCode).toEqual(404);
  });
});
