import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import { OctoPrintApiMock } from "../mocks/octoprint-api.mock";
import { AppConstants } from "@/server.constants";
import { Test } from "supertest";
import { PrinterSettingsController } from "@/controllers/printer-settings.controller";
import TestAgent from "supertest/lib/agent";
import { IdType } from "@/shared.constants";

const defaultRoute = `${AppConstants.apiRoute}/printer-settings`;

const getRoute = (id: IdType) => `${defaultRoute}/${id}`;
const setGCodeAnalysisRoute = (id: IdType) => `${getRoute(id)}/gcode-analysis`;
const syncPrinterNameRoute = (id: IdType) => `${getRoute(id)}/sync-printername`;

let request: TestAgent<Test>;
let octoprintClient: OctoPrintApiMock;

beforeAll(async () => {
  ({ request, octoprintClient } = await setupTestApp(true));
});

describe(PrinterSettingsController.name, () => {
  it("should return printer settings from OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    octoprintClient.storeResponse(
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
    octoprintClient.storeResponse({}, 200);
    const response = await request.post(setGCodeAnalysisRoute(testPrinter.id)).send({
      enabled: false,
    });
    expectOkResponse(response, {});
  });

  it("should sync printer name to OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    octoprintClient.storeResponse({}, 200);
    const response = await request.post(syncPrinterNameRoute(testPrinter.id)).send({});
    expectOkResponse(response, {});
  });
});
