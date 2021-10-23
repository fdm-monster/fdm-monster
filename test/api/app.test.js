jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectOkResponse } = require("../extensions");

let request;

const welcomeRoute = AppConstants.apiRoute + "/";
const getRoute = welcomeRoute;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

describe("AppController", () => {
  it("should return welcome", async function () {
    const response = await request.get(getRoute).send();

    expect(response.body).toMatchObject({
      message:
        "Login not required. Please load UI instead by requesting any route with text/html Content-Type"
    });

    expectOkResponse(response);
  });
});
