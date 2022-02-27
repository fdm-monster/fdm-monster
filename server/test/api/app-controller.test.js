const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");

let request;

const welcomeRoute = AppConstants.apiRoute;
const getRoute = welcomeRoute;
const versionRoute = `${welcomeRoute}/version`;

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

  it("should return version", async function () {
    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      isDockerContainer: false,
      isPm2: false,
      update: {
        includingPrerelease: false,
        airGapped: false,
        updateAvailable: true
      }
    });
  });
});
