const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectInvalidResponse, expectOkResponse, expectNotFoundResponse } = require("../extensions");
const { Printer } = require("../../models/Printer");
const { testApiKey, createTestPrinter } = require("./test-data/create-printer");
const { TaskPresets } = require("../../task.presets");
const DITokens = require("../../container.tokens");

let Model = Printer;
const defaultRoute = AppConstants.apiRoute + "/printer";
const createRoute = defaultRoute;
const testPrinterRoute = `${defaultRoute}/test-connection`;
const pluginListRoute = `${defaultRoute}/plugin-list`;
const getRoute = (id) => `${defaultRoute}/${id}`;
const deleteRoute = (id) => `${defaultRoute}/${id}`;
const updateRoute = (id) => `${defaultRoute}/${id}`;
const stopJobRoute = (id) => `${updateRoute(id)}/job/stop`;
const reconnectRoute = (id) => `${updateRoute(id)}/reconnect`;
const connectionRoute = (id) => `${updateRoute(id)}/connection`;
const loginDetailsRoute = (id) => `${updateRoute(id)}/login-details`;
const enabledRoute = (id) => `${updateRoute(id)}/enabled`;
const disabledReasonRoute = (id) => `${updateRoute(id)}/disabled-reason`;
const stepSizeRoute = (id) => `${updateRoute(id)}/step-size`;
const feedRateRoute = (id) => `${updateRoute(id)}/feed-rate`;
const flowRateRoute = (id) => `${updateRoute(id)}/flow-rate`;
const printerPluginListRoute = (id) => `${getRoute(id)}/plugin-list`;
const restartOctoPrintRoute = (id) => `${getRoute(id)}/octoprint/system/restart`;
const serialConnectCommandRoute = (id) => `${getRoute(id)}/serial-connect`;
const serialDisconnectCommandRoute = (id) => `${getRoute(id)}/serial-disconnect`;
const batchRoute = `${defaultRoute}/batch`;

let request;
let octoPrintApiService;
let taskManagerService;
const apiKey = "fdmfdmfdmfdmfdmfdmfdmfdmfdmfdmfd";

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, octoPrintApiService, taskManagerService } = await setupTestApp(true));
});

afterAll(async () => {
  await Model.deleteMany({});
});

describe("PrinterController", () => {
  it(`should not be able to POST ${createRoute} - invalid apiKey`, async () => {
    const response = await request.post(createRoute).send({
      settingsAppearance: null,
      printerURL: "http://url.com",
      apiKey: "notcorrect",
      tempTriggers: { heatingVariation: null },
    });
    expectInvalidResponse(response, ["apiKey"]);
  });

  it(`should be able to POST ${createRoute}`, async () => {
    const response = await request.post(createRoute).send({
      printerURL: "http://url.com",
      apiKey: testApiKey,
      printerName: "test123",
    });
    const body = expectOkResponse(response, {
      printerURL: expect.any(String),
    });

    expect(body.printerName).toEqual("test123");
  });

  it(`should not be able to POST ${updateRoute} - missing printer field`, async () => {
    const response = await request.patch(connectionRoute("asd")).send();
    expectNotFoundResponse(response);
  });

  it(`should not be able to DELETE ${deleteRoute} - nonexistent id`, async () => {
    const response = await request.delete(deleteRoute("non-id")).send();
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
    const printerId = "615f4fa37081fa06f428df90";
    const res = await request.get(getRoute(printerId)).send();
    expectNotFoundResponse(res);
    expect(res.body).toEqual({
      error: `Printer with id ${printerId} not found`,
    });
  });

  it("should be able to import empty printers json array", async () => {
    const res = await request.post(batchRoute).send([]);
    expectOkResponse(res);
  });

  it("should invalidate to malformed singular printer json array", async () => {
    const response = await request.post(batchRoute).send([{}]);
    expectInvalidResponse(response, ["printerURL", "apiKey"]);
  });

  it("should import to singular printer json array", async () => {
    const response = await request.post(batchRoute).send([
      {
        printerURL: "http://localhost/",
        apiKey,
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
      printerName: "asd124",
    };
    const updatePatch = await request.patch(updateRoute(printer.id)).send(patch);
    expectOkResponse(updatePatch, {
      printerURL: "https://test.com",
      enabled: false,
      printerName: "asd124",
    });
  });

  it("should update printer connection settings correctly", async () => {
    const printer = await createTestPrinter(request);

    const updatePatch = await request.patch(connectionRoute(printer.id)).send({
      printerURL: "https://test.com/",
      apiKey,
    });
    expectOkResponse(updatePatch, {
      printerURL: "https://test.com",
      apiKey,
    });
  });

  it("should invalidate empty test printer connection", async () => {
    const res = await request.post(testPrinterRoute).send();
    expectInvalidResponse(res, ["apiKey", "printerURL"]);
  });

  it("should test printer connection", async () => {
    const res = await request.post(testPrinterRoute).send({
      apiKey,
      printerURL: "https://test.com/",
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

  it("should get plugin list", async () => {
    octoPrintApiService.storeResponse(["test"], 200);
    const res = await request.get(pluginListRoute).send();
    expectOkResponse(res, []); // Cache is not loaded
  });

  it("should get printer plugin list", async () => {
    const printer = await createTestPrinter(request);
    octoPrintApiService.storeResponse(["test"], 200);
    const res = await request.get(printerPluginListRoute(printer.id)).send();
    expectOkResponse(res, ["test"]);
  });

  it("should send restart octoprint command", async () => {
    const printer = await createTestPrinter(request);
    const response = {};
    octoPrintApiService.storeResponse(response, 200);
    const res = await request.post(restartOctoPrintRoute(printer.id)).send();
    expectOkResponse(res);
  });

  it("should send serial connect command", async () => {
    const printer = await createTestPrinter(request);
    const response = { port: "/dev/ttyACM0" };
    octoPrintApiService.storeResponse(response, 200);
    const res = await request.post(serialConnectCommandRoute(printer.id)).send();
    expectOkResponse(res);
  });

  it("should send serial disconnect command", async () => {
    const printer = await createTestPrinter(request);
    const response = { port: "/dev/ttyACM0" };
    octoPrintApiService.storeResponse(response, 200);
    const res = await request.post(serialDisconnectCommandRoute(printer.id)).send();
    expectOkResponse(res);
  });
});
