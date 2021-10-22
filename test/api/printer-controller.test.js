jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const Printer = require("../../server/models/Printer");
const { testApiKey, createTestPrinter } = require("./test-data/create-printer");

let request;

const printerRoute = AppConstants.apiRoute + "/printer";
const getRoute = printerRoute;
const deleteRoute = printerRoute;
const createRoute = printerRoute;
const updateRoute = printerRoute;
const batchRoute = `${printerRoute}/batch`;

const apiKey = "3dpf3dpf3dpf3dpf3dpf3dpf3dpf3dpf";

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  request = supertest(server);
});

afterAll(async () => {
  return Printer.deleteMany({});
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
    const response = await request.patch(`${updateRoute}/asd/connection`).send({});

    expectInvalidResponse(response, ["printerId"], false);
  });

  it(`should not be able to DELETE ${deleteRoute} - nonexistent id`, async () => {
    const response = await request.delete(`${deleteRoute}/non-id`).send();
    expectInvalidResponse(response, ["printerId"], true);
  });

  it(`should be able to DELETE ${deleteRoute} - existing id`, async () => {
    const printer = await createTestPrinter(request);

    const deletionResponse = await request.delete(`${deleteRoute}/${printer.id}`).send();
    expectOkResponse(deletionResponse, expect.anything());
  });

  it("should return printer list when no Id is provided", async function () {
    const response = await request.get(getRoute).send();

    expectOkResponse(response);
  });

  it("should return no printer Info entry when Id is provided but doesnt exist", async function () {
    const printerId = "615f4fa37081fa06f428df90";
    const res = await request.get(`${getRoute}/${printerId}`).send();

    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({
      error: `The printer ID '${printerId}' was not found in the PrintersStore.`
    });
  });

  it("should be able to import empty printers json array", async function () {
    const path = batchRoute;
    const res = await request.post(path).send([]);

    // Assert server succeeded
    expect(res.statusCode).toEqual(200);
  });

  it("should invalidate to malformed singular printer json array", async function () {
    const path = batchRoute;
    const response = await request.post(path).send([{}]);

    // Assert server failed
    expectInvalidResponse(response, ["printerURL", "apiKey", "webSocketURL"]);
  });

  it("should import to singular printer json array", async function () {
    const path = batchRoute;
    const response = await request.post(path).send([
      {
        printerURL: "http://localhost/",
        webSocketURL: "ws://localhost/",
        apiKey
      }
    ]);

    // Assert server succeeded
    expectOkResponse(response);
  });

  it("should update printer correctly", async function () {
    const createdPrinter = await createTestPrinter(request);
    expect(createdPrinter.enabled).toBe(false);

    const patch = {
      webSocketURL: "ws://google.com",
      printerURL: "https://test.com/",
      apiKey,
      enabled: false,
      printerName: "asd124"
    };
    const updatePatch = await request.patch(`${updateRoute}/${createdPrinter.id}`).send(patch);
    expectOkResponse(updatePatch, patch);
  });

  it("should update printer connection settings correctly", async function () {
    const printer = await createTestPrinter(request);

    const updatePatch = await request.patch(`${printerRoute}/${printer.id}/connection`).send({
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

    const updatePatch = await request.patch(`${printerRoute}/${printer.id}/enabled`).send({
      enabled: false
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer stepSize setting correctly", async function () {
    const printer = await createTestPrinter(request);

    const updatePatch = await request.patch(`${printerRoute}/${printer.id}/step-size`).send({
      stepSize: 0.1
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer feed rate setting correctly", async function () {
    const printer = await createTestPrinter(request);

    const updatePatch = await request.patch(`${printerRoute}/${printer.id}/feed-rate`).send({
      feedRate: 10
    });
    expectOkResponse(updatePatch);
  });

  it("should update printer flow rate setting correctly", async function () {
    const printer = await createTestPrinter(request);

    const updatePatch = await request.patch(`${printerRoute}/${printer.id}/flow-rate`).send({
      flowRate: 75
    });
    expectOkResponse(updatePatch);
  });

  it("should reset printer power settings correctly", async function () {
    const printer = await createTestPrinter(request);

    const updatePatch = await request
      .patch(`${printerRoute}/${printer.id}/reset-power-settings`)
      .send();
    expectOkResponse(updatePatch);
  });

  it("should get printer connection logs cache", async function () {
    const printer = await createTestPrinter(request);

    const updatePatch = await request.get(`${printerRoute}/${printer.id}/connection-logs`).send();
    expectOkResponse(updatePatch);
  });

  it("should get printer plugin list", async function () {
    const printer = await createTestPrinter(request);

    // TODO mock op client
    const data = await request.get(`${printerRoute}/${printer.id}/plugin-list`).send();

    // Our google.com 'printer' indeed responds
    expectOkResponse(data);
  });
});
