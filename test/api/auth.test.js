jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectOkResponse, expectInvalidResponse } = require("../extensions");

let request;

const baseRoute = AppConstants.apiRoute + "/users";
const loginRoute = `${baseRoute}/login`;

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  request = supertest(server);
});

describe("AuthController", () => {
  it("should fail login without creds", async function () {
    const response = await request.post(loginRoute).send();

    expectInvalidResponse(response);
  });
});
