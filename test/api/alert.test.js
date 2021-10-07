jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const Alert = require("../../server/models/Alerts");

let request;

const alertsRoute = AppConstants.apiRoute + "/alert";
const getRoute = alertsRoute;

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
});
