const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const {
  expectOkResponse,
  expectInvalidResponse,
  expectUnauthorizedResponse
} = require("../extensions");
const { getUserData, createTestUser } = require("./test-data/create-user");

let request;

const baseRoute = AppConstants.apiRoute + "/users";
const loginRoute = `${baseRoute}/login`;
const registerRoute = `${baseRoute}/register`;
const logoutRoute = `${baseRoute}/logout`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

describe("AuthController", () => {
  it("should fail login without creds", async () => {
    const response = await request.post(loginRoute).send();
    expectInvalidResponse(response);
  });

  it("should not authorize unknown credentials", async () => {
    const response = await request.post(loginRoute).send({ username: "test", password: "test" });
    expectUnauthorizedResponse(response);
  });

  it("should register new user", async () => {
    const password = "registeredPassword";
    const { username, name } = getUserData(password);
    const response = await request.post(registerRoute).send({
      username,
      name,
      password,
      password2: password,
      roles: []
    });
    expectOkResponse(response);
  });

  it("should authorize known user", async () => {
    const password = "newPassword";
    const { username } = await createTestUser(password);
    const response = await request.post(loginRoute).send({ username, password });
    expectOkResponse(response);
  });

  it("should succeed logout", async () => {
    const response = await request.post(logoutRoute).send();

    expectOkResponse(response);
  }, 10000);
});
