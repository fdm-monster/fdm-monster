jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse, expectInvalidResponse } = require("../extensions");

let request;

const baseRoute = AppConstants.apiRoute + "/users";
const loginRoute = `${baseRoute}/login`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

describe("AuthController", () => {
  it("should fail login without creds", async function () {
    const response = await request.post(loginRoute).send();

    expectInvalidResponse(response);
  });
});
