const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { Printer } = require("../../models/Printer");
const { createTestPrinter } = require("./test-data/create-printer");
const { expectOkResponse, expectInvalidResponse, expectNotFoundResponse } = require("../extensions");
const nock = require("nock");

let Model = Printer;
const defaultRoute = AppConstants.apiRoute + "/batch";
const batchConnectUsbRoute = `${defaultRoute}/connect/usb`;
const batchConnectSocketRoute = `${defaultRoute}/connect/socket`;
const batchReprintRoute = `${defaultRoute}/reprint`;

let request;
let octoPrintApiService;
let container;
beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container, octoPrintApiService } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
  octoPrintApiService.storeResponse(undefined, undefined);
});

describe("BatchCallController", () => {
  it("should allow POST to batch reprint many printer files", async () => {
    const printer = await createTestPrinter(request);
    const printer2 = await createTestPrinter(request);
    const response = await request.post(batchReprintRoute).send({
      printerIds: [printer.id, printer2.id],
    });
    expectOkResponse(response);
  });
  it("should allow POST to batch connect printer usbs", async () => {
    const printer = await createTestPrinter(request);
    const printer2 = await createTestPrinter(request);
    const response = await request.post(batchConnectUsbRoute).send({
      printerIds: [printer.id, printer2.id],
    });
    expectOkResponse(response);
  });
  it("should allow POST to batch connect printer sockets", async () => {
    const printer = await createTestPrinter(request, true);
    const printer2 = await createTestPrinter(request, true);
    const response = await request.post(batchConnectSocketRoute).send({
      printerIds: [printer.id, printer2.id],
    });
    expectOkResponse(response);
  });
});
