const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const {
  expectOkResponse,
  expectInvalidResponse,
  expectUnauthorizedResponse, expectInternalServerError
} = require("../extensions");
const { getUserData, ensureTestUserCreated } = require("./test-data/create-user");
const DITokens = require("../../server/container.tokens");

let request;
let container;

const baseRoute = AppConstants.apiRoute + "/users";
const loginRoute = `${baseRoute}/login`;
const registerRoute = `${baseRoute}/register`;
const logoutRoute = `${baseRoute}/logout`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
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

    const { username, name } = getUserData("default1", password);
    const response = await request.post(registerRoute).send({
      username,
      name,
      password,
      password2: password
    });
    expectOkResponse(response);
  });

  it("should fail new user registration when server:registration is disabled", async () => {
    await container.resolve(DITokens.settingsStore).setRegistrationEnabled(false);
    const response = await request.post(registerRoute).send();
    expectInternalServerError(response);
  });

  it("should authorize known user", async () => {
    const password = "newPassword";
    const { username } = await ensureTestUserCreated("default", password);
    const response = await request.post(loginRoute).send({ username, password });
    expectOkResponse(response);
  });

  it("should succeed logout", async () => {
    const response = await request.post(logoutRoute).send();
    expectOkResponse(response);
  }, 10000);
});
