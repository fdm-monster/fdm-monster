const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse, expectNotFoundResponse } = require("../extensions");
const { createTestPrinter } = require("./test-data/create-printer");
const UserModel = require("../../server/models/Auth/User");
const { ensureTestUserCreated } = require("./test-data/create-user");

let Model = UserModel;
const defaultRoute = `${AppConstants.apiRoute}/user`;
const getRoute = (id) => `${defaultRoute}/${id}`;
const deleteRoute = (id) => `${defaultRoute}/${id}`;

let container;
let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
});

describe("UserController", () => {
  it("should return user list", async function () {
    await ensureTestUserCreated();
    const response = await request.get(defaultRoute).send();
    expect(response.body?.length).toBeGreaterThanOrEqual(1);
    expectOkResponse(response);
  });

  it("should get user without passwordHash", async function () {
    const user = await ensureTestUserCreated();
    const response = await request.get(getRoute(user.id)).send();
    expectOkResponse(response, { username: expect.any(String) });

    // Password hash should not be sent
    expect(response.body.passwordHash).toBeUndefined();
  });

  it("should delete existing user", async function () {
    const user = await ensureTestUserCreated();
    const response = await request.delete(deleteRoute(user.id)).send();
    expectOkResponse(response);

    const responseVerification = await request.get(getRoute(user.id)).send();
    expectNotFoundResponse(responseVerification);
  });
});
