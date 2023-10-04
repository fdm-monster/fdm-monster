import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { expectBadRequestError, expectOkResponse, expectUnauthorizedResponse } from "../extensions";
import { ensureTestUserCreated, getUserData } from "./test-data/create-user";
import { DITokens } from "@/container.tokens";
import { connect } from "../db-handler";
import { AwilixContainer } from "awilix";
import supertest from "supertest";
import { SettingsStore } from "@/state/settings.store";
import { loginTestUser } from "./auth/login-test-user";

let request: supertest.SuperTest<supertest.Test>;
let container: AwilixContainer;
let settingsStore: SettingsStore;

const baseRoute = AppConstants.apiRoute + "/auth";
const loginRoute = `${baseRoute}/login`;
const registerRoute = `${baseRoute}/register`;
const logoutRoute = `${baseRoute}/logout`;
const verifyLoginRoute = `${baseRoute}/verify`;

beforeAll(async () => {
  await connect();
  ({ request, container } = await setupTestApp(true));
  settingsStore = container.resolve(DITokens.settingsStore);
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

  it("should not register new user when registration==false", async () => {
    await settingsStore.setRegistrationEnabled(false);
    const password = "registeredPassword";

    const { username } = getUserData("default1", password);
    const response = await request.post(registerRoute).send({
      username,
      password,
      password2: password,
    });
    expectBadRequestError(response);
  });

  it("should register new user", async () => {
    await settingsStore.setRegistrationEnabled(true);
    const password = "registeredPassword";

    const { username } = getUserData("default1", password);
    const response = await request.post(registerRoute).send({
      username,
      password,
      password2: password,
    });
    expectOkResponse(response);

    expectBadRequestError(
      await request.post(registerRoute).send({
        username: "root1234",
        password,
        password2: password,
      })
    );
    expectBadRequestError(
      await request.post(registerRoute).send({
        username: "admin1234",
        password,
        password2: password,
      })
    );
    expectBadRequestError(
      await request.post(registerRoute).send({
        username: "demo",
        password,
        password2: password,
      })
    );
    expectOkResponse(
      await request.post(registerRoute).send({
        username: "demo1234",
        password,
        password2: password,
      })
    );
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

  it("should get loginRequired", async () => {
    await settingsStore.setLoginRequired(true);
    await settingsStore.setRegistrationEnabled(true);
    const response = await request.get(`${baseRoute}/login-required`).send();
    expectOkResponse(response);
    expect(response.body.loginRequired).toBe(true);
    expect(response.body.wizardState.wizardCompleted).toBe(false);
    expect(response.body.registration).toBe(true);
  });

  it("should get verifyLogin", async () => {
    await settingsStore.setLoginRequired();
    const response = await request.post(verifyLoginRoute).send();
    expectUnauthorizedResponse(response);

    await settingsStore.setLoginRequired(false);
    const response2 = await request.post(verifyLoginRoute).send();
    expectOkResponse(response2);
  });

  it("should get needsPasswordChange", async () => {
    // Not authenticated
    await settingsStore.setLoginRequired(true);
    const response = await request.post(`${baseRoute}/needs-password-change`).send();
    expectOkResponse(response);
    expect(response.body.needsPasswordChange).toBe(null);

    // No authentication required
    await settingsStore.setLoginRequired(false);
    const response2 = await request.post(`${baseRoute}/needs-password-change`).send();
    expectOkResponse(response2);
    expect(response2.body.needsPasswordChange).toBe(false);

    const { token, refreshToken } = await loginTestUser(request);
    const response3 = await request.post(`${baseRoute}/needs-password-change`).set("Authorization", `Bearer ${token}`).send();
    expectOkResponse(response3);
    expect(response3.body.needsPasswordChange).toBe(false);
  });

  it("should refresh login", async () => {
    const { refreshToken, token } = await loginTestUser(request);
    const response = await request.post(`${baseRoute}/refresh`).set("Authorization", `Bearer ${token}`).send({ refreshToken });
    expectOkResponse(response);
    expect(response.body.token).toBeTruthy();
  });
});
