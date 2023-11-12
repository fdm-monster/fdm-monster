import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import { OctoPrintApiMock } from "../mocks/octoprint-api.mock";
import { AppConstants } from "@/server.constants";
import supertest from "supertest";
import { connect } from "../db-handler";
import { PrinterSettingsController } from "@/controllers/printer-settings.controller";

const defaultRoute = `${AppConstants.apiRoute}/printer-settings`;

const getRoute = (id: string) => `${defaultRoute}/${id}`;
const setGCodeAnalysisRoute = (id: string) => `${getRoute(id)}/gcode-analysis`;
const syncPrinterNameRoute = (id: string) => `${getRoute(id)}/sync-printername`;

let request: supertest.SuperTest<supertest.Test>;
let octoPrintApiService: OctoPrintApiMock;

beforeAll(async () => {
  await connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

describe(PrinterSettingsController.name, () => {
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
