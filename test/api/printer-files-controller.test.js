jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../app-test");
const Printer = require("../../server/models/Printer");
const { createTestPrinter } = require("./test-data/create-printer");
const {
  expectOkResponse,
  expectInvalidResponse,
  expectNotFoundResponse
} = require("../extensions");

let Model = Printer;
const printerFilesRoute = AppConstants.apiRoute + "/printer-files";
const trackedUploadsRoute = `${printerFilesRoute}/tracked-uploads`;
const getRoute = (id) => `${printerFilesRoute}/${id}`;
const clearFilesRoute = (id) => `${getRoute(id)}/clear`;
const getFilesRoute = (id, recursive) => `${getRoute(id)}?recursive=${recursive}`;
const getCacheRoute = (id) => `${getRoute(id)}/cache`;

let request;
let octoPrintApiService;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
  octoPrintApiService.storeResponse(undefined, undefined);
});

describe("PrinterFilesController", () => {
  it(`should return 404 on ${printerFilesRoute} for nonexisting printer`, async () => {
    const res = await request.get(getRoute("60ae2b760bca4f5930be3d88")).send();
    expectNotFoundResponse(res);
  });

  it(`should require 'recursive' on ${printerFilesRoute} for existing printer`, async () => {
    const printer = await createTestPrinter(request);
    const response = await request.get(getRoute(printer.id)).send();
    expectInvalidResponse(response, ["recursive"]);
  });

  it(`should retrieve files on GET for existing printer`, async () => {
    const printer = await createTestPrinter(request);
    octoPrintApiService.storeResponse([], 200);
    const response = await request.get(getFilesRoute(printer.id, false)).send();
    expectOkResponse(response, []);
  });

  it("should allow GET on printer files cache", async () => {
    const printer = await createTestPrinter(request);
    const response = await request.get(getCacheRoute(printer.id)).send();
    expectOkResponse(response);
  });

  it("should allow GET on printer files - tracked uploads", async () => {
    const response = await request.get(trackedUploadsRoute).send();
    expectOkResponse(response);
  });

  it("should allow GET on printer files - tracked uploads", async () => {
    const response = await request.get(trackedUploadsRoute).send();
    expectOkResponse(response);
  });

  it("should allow DELETE to clear printer files - with status result", async () => {
    const printer = await createTestPrinter(request);
    octoPrintApiService.storeResponse({ files: [] }, 200);
    const response = await request.delete(clearFilesRoute(printer.id)).send();
    expectOkResponse(response, {
      succeededFiles: expect.any(Array),
      failedFiles: expect.any(Array)
    });
  });
});
