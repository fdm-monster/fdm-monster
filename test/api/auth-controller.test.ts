import { beforeAll, describe, it } from "@jest/globals";

import dbHandler = require("../db-handler");
import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { expectOkResponse, expectUnauthorizedResponse, expectBadRequestError } from "../extensions";
import { getUserData, ensureTestUserCreated } from "./test-data/create-user";
import { DITokens } from "@/container.tokens";

let request;
let container;

const baseRoute = AppConstants.apiRoute + "/auth";
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
    expectUnauthorizedResponse(response);
  });

  it("should not authorize unknown credentials", async () => {
    const response = await request.post(loginRoute).send({ username: "test", password: "test" });
    expectUnauthorizedResponse(response);
  });

  it("should register new user", async () => {
    const password = "registeredPassword";

    const { username } = getUserData("default1", password);
    const response = await request.post(registerRoute).send({
      username,
      password,
      password2: password,
    });
    expectOkResponse(response);
  });

  it("should fail new user registration when server:registration is disabled", async () => {
    await container.resolve(DITokens.settingsStore).setRegistrationEnabled(false);
    const response = await request.post(registerRoute).send();
    expectBadRequestError(response);
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
  });
});
