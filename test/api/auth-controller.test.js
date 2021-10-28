const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const {
  expectOkResponse,
  expectInvalidResponse,
  expectUnauthorizedResponse
} = require("../extensions");
const { createTestUser } = require("./test-data/create-user");

let request;

const baseRoute = AppConstants.apiRoute + "/users";
const loginRoute = `${baseRoute}/login`;
const logoutRoute = `${baseRoute}/logout`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

describe("AuthController", () => {
  it("should fail login without creds", async function () {
    const response = await request.post(loginRoute).send();
    expectInvalidResponse(response);
  });

  it("should not authorize unknown credentials", async function () {
    const response = await request.post(loginRoute).send({ username: "test", password: "test" });
    expectUnauthorizedResponse(response);
  });

  test.skip("should authorize known credentials", async function () {
    const defaultPassword = "testpassword";
    const { username } = await createTestUser(defaultPassword);
    const response = await request.post(loginRoute).send({ username, password: defaultPassword });
    expectOkResponse(response);
  });

  it("should succeed logout", async function () {
    const response = await request.post(logoutRoute).send();

    expectOkResponse(response);
  }, 10000);
});
