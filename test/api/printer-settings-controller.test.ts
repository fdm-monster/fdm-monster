import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import { AppConstants } from "@/server.constants";
import { Test } from "supertest";
import { PrinterSettingsController } from "@/controllers/printer-settings.controller";
import TestAgent from "supertest/lib/agent";
import nock from "nock";

const defaultRoute = `${AppConstants.apiRoute}/printer-settings`;

const getRoute = (id: number) => `${defaultRoute}/${id}`;
const setGCodeAnalysisRoute = (id: number) => `${getRoute(id)}/gcode-analysis`;
const syncPrinterNameRoute = (id: number) => `${getRoute(id)}/sync-printername`;

let request: TestAgent<Test>;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

describe(PrinterSettingsController.name, () => {
  it("should return printer settings from OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    nock(testPrinter.printerURL)
      .get("/api/settings")
      .reply(200, {
        api: {
          allowCrossOrigin: true,
          key: "test",
        },
        appearance: {},
        feature: {},
      });
    const response = await request.get(getRoute(testPrinter.id)).send();
    expectOkResponse(response, { api: expect.any(Object) });
  });

  it("should set printer gcode settings to false on OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    nock(testPrinter.printerURL).post("/api/settings").reply(200, {});

    const response = await request.post(setGCodeAnalysisRoute(testPrinter.id)).send({
      enabled: false,
    });
    expectOkResponse(response, {});
  });

  it("should sync printer name to OctoPrint", async () => {
    const testPrinter = await createTestPrinter(request);
    nock(testPrinter.printerURL).post("/api/settings").reply(200, {});

    const response = await request.post(syncPrinterNameRoute(testPrinter.id)).send({});
    expectOkResponse(response, {});
  });
});
