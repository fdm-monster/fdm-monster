jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const Printer = require("../../server/models/Printer");

let request;

const printerRoute = AppConstants.apiRoute + "/printer";
const getRoute = printerRoute;
const deleteRoute = printerRoute;
const createRoute = printerRoute;
const refreshSettingsPath = "query-settings";
const updateRoute = printerRoute;

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  request = supertest(server);
});

beforeEach(async () => {
  Printer.deleteMany({});
});

describe("PrintersController", () => {
  // TODO this API endpoint is doing unexpected stuff
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
      apiKey: "3dpf3dpf3dpf3dpf3dpf3dpf3dpf3dpf",
      tempTriggers: { heatingVariation: null }
    });
    expectOkResponse(response, {
      printerState: {
        printerURL: expect.any(String)
      }
    });
  });

  // TODO this API endpoint is doing unexpected stuff, should throw not-found error and not result in 'printersAdded' prop as this is misleading
  it(`should not be able to POST ${updateRoute} - missing printer field`, async () => {
    const response = await request.patch(`${updateRoute}/asd/connection`).send({});

    expectInvalidResponse(response, ["printer"], false);
  });

  it(`should not be able to DELETE ${deleteRoute} - nonexistent id`, async () => {
    const response = await request.delete(`${deleteRoute}/non-id`).send();
    expectInvalidResponse(response, ["id"], true);
  });

  it(`should be able to DELETE ${deleteRoute} - existing id`, async () => {
    const createResponse = await request.post(createRoute).send({
      printerURL: "http://url.com",
      apiKey: "3dpf3dpf3dpf3dpf3dpf3dpf3dpf3dpf",
      tempTriggers: { heatingVariation: null }
    });
    const body = expectOkResponse(createResponse, { printerState: expect.anything() });

    const deletionResponse = await request.delete(`${deleteRoute}/${body.printerState._id}`).send();
    expectOkResponse(deletionResponse, { printerRemoved: expect.anything() });
  });

  it("should return printer list when no Id is provided", async function () {
    const response = await request.get(getRoute).send();

    expectOkResponse(response);
  }, 10000);

  it("should return no printer Info entry when Id is provided but doesnt exist", async function () {
    const printerId = "asd";
    const res = await request.get(`${getRoute}/${printerId}`).send();

    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({
      error: `The printer ID '${printerId}' was not found in the PrintersStore.`
    });
  }, 10000);

  it("should return 400 error when wrong input is provided", async function () {
    const path = printerRoute + "/undefined/" + refreshSettingsPath;
    const response = await request.post(path).send();

    expectInvalidResponse(response, ["id"], true);
  }, 10000);

  it("should return 404 if server fails to find the printer", async function () {
    const printerId = "60ae2b760bca4f5930be3d88";
    const path = `${printerRoute}/${printerId}/${refreshSettingsPath}`;
    const res = await request.post(path).send(path);

    // Assert server failed
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({
      error: `The printer ID '${printerId}' was not found in the PrintersStore.`
    });
    expect(res.res.statusMessage).toContain("Not Found");
  }, 10000);
});
