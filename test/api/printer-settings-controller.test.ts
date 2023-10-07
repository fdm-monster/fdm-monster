import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import { AppConstants } from "@/server.constants";

import { connect } from "../db-handler";

const defaultRoute = `${AppConstants.apiRoute}/printer-settings`;

const getRoute = (id) => `${defaultRoute}/${id}`;
const setGCodeAnalysisRoute = (id) => `${getRoute(id)}/gcode-analysis`;
const syncPrinterNameRoute = (id) => `${getRoute(id)}/sync-printername`;

let request;
let octoPrintApiService;

beforeAll(async () => {
  await connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

describe("PrinterSettingsController", () => {
  it("should return printer settings from OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    octoPrintApiService.storeResponse(
      {
        api: {
          allowCrossOrigin: true,
          key: "test",
        },
        appearance: {},
        feature: {},
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
      enabled: false,
    });
    expectOkResponse(response, {});
  });

  it("should sync printer name to OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    octoPrintApiService.storeResponse({}, 200);
    const response = await request.post(syncPrinterNameRoute(testPrinter.id)).send({});
    expectOkResponse(response, {});
  });
});
