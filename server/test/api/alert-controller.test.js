const dbHandler = require("../db-handler");
const { asValue } = require("awilix");
const DITokens = require("../../container.tokens");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const Alert = require("../../models/Alert");
const { createTestPrinter } = require("./test-data/create-printer");

let Model = Alert;
const listRoute = `${AppConstants.apiRoute}/alert`;
const createRoute = listRoute;
const getRoute = (id) => `${listRoute}/${id}`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${listRoute}/${id}`;
const testAlertScriptRoute = `${listRoute}/test-alert-script`;

let container;
let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
});

beforeEach(async () => {
  return Model.deleteMany({});
});

function getNormalAlert(printerIdArray) {
  return {
    active: true,
    printer: printerIdArray,
    trigger: "tomorrow",
    message: "temperature hit the fan",
    scriptLocation: "../safe_location/script.js"
  };
}

async function createNormalAlert(request, printerIdArray) {
  const response = await request.post(createRoute).send(getNormalAlert(printerIdArray));
  expectOkResponse(response, {
    active: true,
    printer: printerIdArray
  });
  return response.body;
}

describe("AlertController", () => {
  it("should return empty alert list", async function () {
    const response = await request.get(listRoute).send();
    expect(response.body).toMatchObject([]);
    expectOkResponse(response);
  });

  it("should create new alert", async function () {
    const testPrinter = await createTestPrinter(request);
    await createNormalAlert(request, [testPrinter.id]);
  });

  it("should update existing alert", async function () {
    const testPrinter = await createTestPrinter(request);
    const alert = await createNormalAlert(request, [testPrinter.id]);

    const data = {
      ...alert,
      active: false
    };
    const response = await request.put(updateRoute(alert._id)).send(data);

    expectOkResponse(response, {
      active: false
    });
  });

  it("should delete existing alert", async function () {
    const testPrinter = await createTestPrinter(request);
    const alert = await createNormalAlert(request, [testPrinter.id]);
    const response = await request.delete(updateRoute(alert._id)).send();
    expectOkResponse(response);
  });

  it("should fire existing alert script", async function () {
    let triggered = false;

    // Mock the internal service
    container.register({
      [DITokens.scriptService]: asValue({
        execute: () => {
          triggered = true;
        }
      })
    });

    // Trigger the 'script'
    const response = await request.post(testAlertScriptRoute).send({
      scriptLocation: "somefile.js",
      message: "Im triggered"
    });
    expectOkResponse(response);

    // Now we test our mock
    expect(triggered).toBeTruthy();
  });
});
