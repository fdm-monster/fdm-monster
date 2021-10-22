jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const Alert = require("../../server/models/Alert");
const { createTestPrinter } = require("./test-data/create-printer");

let request;

const alertsRoute = AppConstants.apiRoute + "/alert";
const getRoute = alertsRoute;
const createRoute = alertsRoute;

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  request = supertest(server);
});

beforeEach(async () => {
  Alert.deleteMany({});
});

describe("AlertController", () => {
  it("should return empty alert list", async function () {
    const response = await request.get(getRoute).send();

    expect(response.body).toMatchObject([]);

    expectOkResponse(response);
  });

  it("should create new alert", async function () {
    const testPrinter = await createTestPrinter(request);
    const response = await request.post(createRoute).send({
      active: true,
      printer: [testPrinter.id],
      trigger: "tomorrow",
      message: "temperature hit the fan",
      scriptLocation: "../safe_location/script.js"
    });

    expectOkResponse(response, {
      active: true,
      printer: [testPrinter.id]
    });
  });
});
