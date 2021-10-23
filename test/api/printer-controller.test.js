jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../app-test");
const {
  expectInvalidResponse,
  expectOkResponse,
  expectNotFoundResponse
} = require("../extensions");
const Printer = require("../../server/models/Printer");
const { testApiKey, createTestPrinter } = require("./test-data/create-printer");

let Model = Printer;
const listRoute = AppConstants.apiRoute + "/printer";
const createRoute = listRoute;
const getRoute = (id) => `${listRoute}/${id}`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${listRoute}/${id}`;
const connectionRoute = (id) => `${updateRoute(id)}/connection`;
const enabledRoute = (id) => `${updateRoute(id)}/enabled`;
const stepSizeRoute = (id) => `${updateRoute(id)}/step-size`;
const feedRateRoute = (id) => `${updateRoute(id)}/feed-rate`;
const flowRateRoute = (id) => `${updateRoute(id)}/flow-rate`;
const resetPowerSettingsRoute = (id) => `${updateRoute(id)}/reset-power-settings`;
const connectionLogsRoute = (id) => `${getRoute(id)}/connection-logs`;
const pluginListRoute = (id) => `${getRoute(id)}/plugin-list`;
const batchRoute = `${listRoute}/batch`;

let request;
let octoPrintApiService;
const apiKey = "3dpf3dpf3dpf3dpf3dpf3dpf3dpf3dpf";

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

afterAll(async () => {
  return Model.deleteMany({});
});

describe("PrintersController", () => {
  it(`should not be able to POST ${createRoute} - invalid apiKey`, async () => {
    const response = await request.post(createRoute).send({
      settingsAppearance: null,
      printerURL: "http://url.com",
      apiKey: "notcorrect",
      tempTriggers: { heatingVariation: null }
    });
    expectInvalidResponse(response, ["apiKey"]);
  });

  it(`should be able to POST ${createRoute}`, async () => {
    const response = await request.post(createRoute).send({
      printerURL: "http://url.com",
      apiKey: testApiKey,
      printerName: "test123",
      tempTriggers: { heatingVariation: null }
    });
    const body = expectOkResponse(response, {
      printerURL: expect.any(String)
    });

    expect(body.printerName).toEqual("test123");
  });

  it(`should not be able to POST ${updateRoute} - missing printer field`, async () => {
    const response = await request.patch(connectionRoute("asd")).send();
    expectInvalidResponse(response, ["printerId"], false);
  });

  it(`should not be able to DELETE ${deleteRoute} - nonexistent id`, async () => {
    const response = await request.delete(deleteRoute("non-id")).send();
    expectInvalidResponse(response, ["printerId"], true);
  });

  it(`should be able to DELETE ${deleteRoute} - existing id`, async () => {
    const printer = await createTestPrinter(request);

    const deletionResponse = await request.delete(deleteRoute(printer.id)).send();
    expectOkResponse(deletionResponse, expect.anything());
  });

  it("should return printer list when no Id is provided", async function () {
    const response = await request.get(listRoute).send();

    expectOkResponse(response);
  });

  it("should return no printer Info entry when Id is provided but doesnt exist", async function () {
    const printerId = "615f4fa37081fa06f428df90";
    const res = await request.get(getRoute(printerId)).send();
    expectNotFoundResponse(res);
    expect(res.body).toEqual({
      error: `The printer ID '${printerId}' was not found in the PrintersStore.`
    });
  });

  it("should be able to import empty printers json array", async function () {
    const res = await request.post(batchRoute).send([]);
    expectOkResponse(res);
  });

  it("should invalidate to malformed singular printer json array", async function () {
    const response = await request.post(batchRoute).send([{}]);
    expectInvalidResponse(response, ["printerURL", "apiKey", "webSocketURL"]);
  });

  it("should import to singular printer json array", async function () {
    const response = await request.post(batchRoute).send([
      {
        printerURL: "http://localhost/",
        webSocketURL: "ws://localhost/",
        apiKey
      }
    ]);
    expectOkResponse(response);
  });

  it("should update printer correctly", async function () {
    const printer = await createTestPrinter(request);
    expect(printer.enabled).toBe(false);

    const patch = {
      webSocketURL: "ws://google.com",
      printerURL: "https://test.com/",
      apiKey,
      enabled: false,
      printerName: "asd124"
    };
    const updatePatch = await request.patch(updateRoute(printer.id)).send(patch);
    expectOkResponse(updatePatch, patch);
  });

  it("should update printer connection settings correctly", async function () {
    const printer = await createTestPrinter(request);

    const updatePatch = await request.patch(connectionRoute(printer.id)).send({
      webSocketURL: "ws://google.com",
      printerURL: "https://test.com/",
      apiKey
    });
    expectOkResponse(updatePatch, {
      webSocketURL: "ws://google.com/", // Sanitized
      printerURL: "https://test.com/",
      apiKey
    });
  });

  it("should update printer enabled setting correctly", async function () {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(enabledRoute(printer.id)).send({
      enabled: false
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer stepSize setting correctly", async function () {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(stepSizeRoute(printer.id)).send({
      stepSize: 0.1
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer feed rate setting correctly", async function () {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(feedRateRoute(printer.id)).send({
      feedRate: 10
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer flow rate setting correctly", async function () {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(flowRateRoute(printer.id)).send({
      flowRate: 75
    });
    expectOkResponse(updatePatch);
  });

  it("should reset printer power settings correctly", async function () {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.patch(resetPowerSettingsRoute(printer.id)).send();
    expectOkResponse(updatePatch);
  });

  it("should get printer connection logs cache", async function () {
    const printer = await createTestPrinter(request);
    const updatePatch = await request.get(connectionLogsRoute(printer.id)).send();
    expectOkResponse(updatePatch);
  });

  it("should get printer plugin list", async function () {
    const printer = await createTestPrinter(request);
    octoPrintApiService.storeResponse(["test"], 200);
    const res = await request.get(pluginListRoute(printer.id)).send();
    expectOkResponse(res, ["test"]);
  });
});
