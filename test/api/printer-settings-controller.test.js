const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const PrinterGroup = require("../../server/models/PrinterGroup");
const { createTestPrinterGroup } = require("./test-data/create-printer-group");
const { createTestPrinter } = require("./test-data/create-printer");

let Model = PrinterGroup;
const defaultRoute = `${AppConstants.apiRoute}/printer-settings`;

const getRoute = (id) => `${defaultRoute}/${id}`;
const setGCodeAnalysisRoute = (id) => `${getRoute(id)}/gcode-analysis`;

let request;
let octoPrintApiService;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe("PrinterSettingsController", () => {
  it("should return printer settings from OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    octoPrintApiService.storeResponse(
      {
        api: {
          allowCrossOrigin: true,
          key: "test"
        },
        appearance: {},
        feature: {}
      },
      200
    );
    const response = await request.get(getRoute(testPrinter.id)).send();
    expectOkResponse(response, { api: expect.any(Object) });
  });

  it("should set printer gcode settings to false on OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    octoPrintApiService.storeResponse({}, 200);
    const response = await request.post(setGCodeAnalysisRoute(testPrinter.id)).send({
      enabled: false
    });
    expectOkResponse(response, {});
  });
});
