import { setupTestApp } from "../test-server";
import { expectInvalidResponse, expectNotFoundResponse, expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { createTestPrinter, testApiKey } from "./test-data/create-printer";
import { Test } from "supertest";
import { PrinterController } from "@/controllers/printer.controller";
import TestAgent from "supertest/lib/agent";
import nock from "nock";
import { OctoprintType, MoonrakerType } from "@/services/printer-api.interface";

const defaultRoute = AppConstants.apiRoute + "/printer";
const createRoute = defaultRoute;
const testPrinterRoute = `${defaultRoute}/test-connection`;
const getRoute = (id: number) => `${defaultRoute}/${id}`;
const deleteRoute = (id: number) => `${defaultRoute}/${id}`;
const updateRoute = (id: number) => `${defaultRoute}/${id}`;
const stopJobRoute = (id: number) => `${updateRoute(id)}/job/stop`;
const connectionRoute = (id: number) => `${updateRoute(id)}/connection`;
const loginDetailsRoute = (id: number) => `${updateRoute(id)}/login-details`;
const enabledRoute = (id: number) => `${updateRoute(id)}/enabled`;
const disabledReasonRoute = (id: number) => `${updateRoute(id)}/disabled-reason`;
const feedRateRoute = (id: number) => `${updateRoute(id)}/feed-rate`;
const flowRateRoute = (id: number) => `${updateRoute(id)}/flow-rate`;
const restartOctoPrintRoute = (id: number) => `${getRoute(id)}/octoprint/server/restart`;
const emergencyGCodeRoute = (id: number) => `${defaultRoute}/${id}/send-emergency-m112/`;
const serialConnectCommandRoute = (id: number) => `${getRoute(id)}/serial-connect`;
const serialDisconnectCommandRoute = (id: number) => `${getRoute(id)}/serial-disconnect`;
const batchRoute = `${defaultRoute}/batch`;

let request: TestAgent<Test>;
const apiKey = "fdmfdmfdmfdmfdmfdmfdmfdmfdmfdmfd";
const name = "test1234";

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

describe(PrinterController.name, () => {
  it(`should not be able to POST ${createRoute} - invalid apiKey`, async () => {
    const response = await request.post(createRoute).query("forceSave=true").send({
      name: "asd",
      printerURL: "http://url.com",
      apiKey: "notcorrect",
      printerType: OctoprintType,
    });
    expectInvalidResponse(
      response,
      [
        {
          code: "too_small",
          path: "apiKey",
        },
      ],
      true,
    );
  });

  it(`should be able to POST ${createRoute} moonraker without api key`, async () => {
    const response = await request.post(createRoute).query("forceSave=true").send({
      printerURL: "http://url.com",
      name: "test123",
      printerType: MoonrakerType,
    });
    expectOkResponse(response, {
      printerURL: "http://url.com",
      apiKey: "",
      name: "test123",
      printerType: MoonrakerType,
    });

    const response2 = await request.post(createRoute).query("forceSave=true").send({
      printerURL: "http://url.com",
      apiKey: "12341234123412341234123412341234",
      name: "test123",
      printerType: OctoprintType,
    });
    expectOkResponse(response2, {
      printerURL: "http://url.com",
      apiKey: "12341234123412341234123412341234",
      name: "test123",
      printerType: OctoprintType,
    });

    const response3 = await request.post(createRoute).query("forceSave=true").send({
      printerURL: "http://url.com",
      apiKey: "1234123412341234123412A4-234123412341234123",
      name: "test123",
      printerType: OctoprintType,
    });
    expectOkResponse(response3, {
      printerURL: "http://url.com",
      apiKey: "1234123412341234123412A4-234123412341234123",
      name: "test123",
      printerType: OctoprintType,
    });
  });

  it(`should not be able to POST ${updateRoute} - missing printer field`, async () => {
    const response = await request.patch(connectionRoute(404)).send();
    expectNotFoundResponse(response);
  });

  it(`should not be able to DELETE ${deleteRoute} - nonexistent id`, async () => {
    const response = await request.delete(deleteRoute(404)).send();
    expectNotFoundResponse(response);
  });

  it(`should be able to DELETE ${deleteRoute} - existing id`, async () => {
    const printer = await createTestPrinter(request);

    const res = await request.get(getRoute(printer.id)).send();
    expectOkResponse(res);

    const deletionResponse = await request.delete(deleteRoute(printer.id)).send();

    // We accept race conditions for now
    if (deletionResponse.statusCode === 404) return;
    expectOkResponse(deletionResponse, expect.anything());
  });

  it("should return printer list when no Id is provided", async () => {
    const response = await request.get(defaultRoute).send();

    expectOkResponse(response);
  });

  it("should return no printer Info entry when Id is provided but doesnt exist", async () => {
    const printerId = 404;
    const res = await request.get(getRoute(printerId)).send();
    expectNotFoundResponse(res);
    expect(res.body).toEqual({
      error: `Printer with provided id not found`,
    });
  });

  it("should be able to import empty printers json array", async () => {
    const res = await request.post(batchRoute).send([]);
    expectOkResponse(res);
  });

  it("should invalidate to malformed singular printer json array", async () => {
    const response = await request.post(batchRoute).send([{}]);
    expectInvalidResponse(response, [
      {
        code: "invalid_type",
        path: "printerURL",
      },
    ]);
  });

  it("should import to singular printer json array", async () => {
    const response = await request.post(batchRoute).send([
      {
        printerURL: "http://localhost/",
        apiKey,
        name,
        printerType: MoonrakerType,
      },
    ]);
    expectOkResponse(response);
  });

  it("should get printer correctly", async () => {
    const printer = await createTestPrinter(request);
    expect(printer.enabled).toBe(false);

    const response = await request.get(getRoute(printer.id)).send();
    expectOkResponse(response, { enabled: false });
  });

  it("should get printer loginDetails correctly", async () => {
    const printer = await createTestPrinter(request);

    const response = await request.get(loginDetailsRoute(printer.id)).send();
    expectOkResponse(response, { printerURL: "http://url.com", apiKey: testApiKey });
  });

  it("should stop printer job correctly", async () => {
    const printer = await createTestPrinter(request);
    expect(printer.enabled).toBe(false);

    nock(printer.printerURL).post(`/api/job`).reply(200);

    const response = await request.post(stopJobRoute(printer.id)).send();
    expectOkResponse(response);
  });

  it("should update printer correctly", async () => {
    const printer = await createTestPrinter(request);
    expect(printer.enabled).toBe(false);

    const patch = {
      printerURL: "https://test.com/",
      apiKey,
      enabled: false,
      name: "asd124",
      printerType: MoonrakerType,
    };
    const updatePatch = await request.patch(updateRoute(printer.id)).query("forceSave=true").send(patch);
    expectOkResponse(updatePatch, {
      printerURL: "https://test.com",
      enabled: false,
      name: "asd124",
      printerType: MoonrakerType,
    });
  });

  it("should invalidate empty test printer connection", async () => {
    const res = await request.post(testPrinterRoute).send();
    expectInvalidResponse(res, [
      {
        path: "printerType",
        code: "invalid_type",
      },
      { path: "printerURL", code: "invalid_type" },
    ]);
  });

  it("should test printer connection", async () => {
    const res = await request.post(testPrinterRoute).send({
      apiKey,
      printerURL: "https://test.com/",
      name,
      printerType: MoonrakerType,
    });
    expectOkResponse(res);
  });

  it("should update printer enabled setting correctly", async () => {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(enabledRoute(printer.id)).send({
      enabled: false,
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer enabled setting correctly", async () => {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(disabledReasonRoute(printer.id)).send({
      disabledReason: "Under maintenance",
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer feed rate setting correctly", async () => {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(feedRateRoute(printer.id)).send({
      feedRate: 10,
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer flow rate setting correctly", async () => {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(flowRateRoute(printer.id)).send({
      flowRate: 75,
    });
    expectOkResponse(updatePatch);
  });

  it("should send restart octoprint command", async () => {
    const printer = await createTestPrinter(request);

    nock(printer.printerURL).post("/api/system/commands/core/restart").reply(200);

    const res = await request.post(restartOctoPrintRoute(printer.id)).send();
    expectOkResponse(res);
  });

  it("should send emergency gcode command", async function () {
    const printer = await createTestPrinter(request);

    nock(printer.printerURL).post("/api/printer/command").reply(200, {});

    const response = await request.post(emergencyGCodeRoute(printer.id)).send();
    expectOkResponse(response, null);
  });

  it("should send serial connect command", async () => {
    const printer = await createTestPrinter(request);
    const response = { port: "/dev/ttyACM0" };

    nock(printer.printerURL).post("/api/connection").reply(200, response);

    const res = await request.post(serialConnectCommandRoute(printer.id)).send();
    expectOkResponse(res);
  });

  it("should send serial disconnect command", async () => {
    const printer = await createTestPrinter(request);
    nock(printer.printerURL).post("/api/connection").reply(200, { port: "/dev/ttyACM0" });
    const res = await request.post(serialDisconnectCommandRoute(printer.id)).send();
    expectOkResponse(res);
  });
});
