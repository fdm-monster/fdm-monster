jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const Alert = require("../../server/models/Alerts");

let request;

const welcomeRoute = "/";
const getRoute = welcomeRoute;

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  request = supertest(server);
});

beforeEach(async () => {
  Alert.deleteMany({});
});

describe("AppController", () => {
  it("should return welcome", async function () {
    const response = await request.get(getRoute).send();

    expect(response.body).toMatchObject({ message: "Login not required. Please load UI instead." });

    expectOkResponse(response);
  });
});
