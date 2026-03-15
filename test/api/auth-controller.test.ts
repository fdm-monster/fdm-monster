import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { expectBadRequestError, expectOkResponse, expectUnauthenticatedResponse } from "../extensions";
import { ensureTestUserCreated, getUserData } from "./test-data/create-user";
import { DITokens } from "@/container.tokens";
import { type AwilixContainer } from "awilix";
import { Test } from "supertest";
import { SettingsStore } from "@/state/settings.store";
import { loginTestUser } from "./auth/login-test-user";
import { AuthService } from "@/services/authentication/auth.service";
import { AuthController } from "@/controllers/auth.controller";
import TestAgent from "supertest/lib/agent";

let request: TestAgent<Test>;
let container: AwilixContainer;
let settingsStore: SettingsStore;
let authService: AuthService;

const baseRoute = AppConstants.apiRoute + "/auth";
const loginRoute = `${baseRoute}/login`;
const registerRoute = `${baseRoute}/register`;
const needsPasswordChangeRoute = `${baseRoute}/needs-password-change`;
const logoutRoute = `${baseRoute}/logout`;
const verifyLoginRoute = `${baseRoute}/verify`;

beforeAll(async () => {
  ({ request, container } = await setupTestApp(true));
  settingsStore = container.resolve(DITokens.settingsStore);
  authService = container.resolve<AuthService>(DITokens.authService);
});

beforeEach(async () => {
  await settingsStore.setRefreshTokenSettings({
    refreshTokenAttempts: 1000,
    refreshTokenExpiry: 1000,
  });
});

describe(AuthController.name, () => {
  it("should fail login without credentials", async () => {
    const response = await request.post(loginRoute).send();
    expectUnauthenticatedResponse(response);
  });

  it("should not authorize unknown account credentials", async () => {
    const response = await request.post(loginRoute).send({ username: "test", password: "test" });
    expectUnauthenticatedResponse(response);
  });

  it("should not authorize known account incorrect password", async () => {
    const userDto = await ensureTestUserCreated();

    const response = await request
      .post(loginRoute)
      .send({ username: userDto.username, password: "definitely-incorrect" });
    expectUnauthenticatedResponse(response);
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
      }),
    );
    expectBadRequestError(
      await request.post(registerRoute).send({
        username: "admin1234",
        password,
        password2: password,
      }),
    );
    expectBadRequestError(
      await request.post(registerRoute).send({
        username: "demo",
        password,
        password2: password,
      }),
    );
    expectOkResponse(
      await request.post(registerRoute).send({
        username: "demo1234",
        password,
        password2: password,
      }),
    );
  });

  it("should fail new user registration when server:registration is disabled", async () => {
    await container.resolve(DITokens.settingsStore).setRegistrationEnabled(false);
    const response = await request.post(registerRoute).send();
    expectBadRequestError(response);
  });

  it("should login known user", async () => {
    const password = "newPassword";
    const { username } = await ensureTestUserCreated("default", password);
    const response = await request.post(loginRoute).send({ username, password });
    expectOkResponse(response);
  });

  it("should succeed logout without loginRequired", async () => {
    await settingsStore.setLoginRequired(false);
    const response = await request.post(logoutRoute).send();
    expectOkResponse(response);
  });

  it("should fail logout when server:loginRequired is true", async () => {
    await settingsStore.setLoginRequired(true);
    const response = await request.post(logoutRoute).send();
    expectUnauthenticatedResponse(response);
  });

  it("should succeed logout when server:loginRequired is true and bearer valid", async () => {
    await settingsStore.setLoginRequired(true);
    const { token, refreshToken } = await loginTestUser(request);
    const response = await request.post(logoutRoute).set("Authorization", `Bearer ${token}`).send();
    expectOkResponse(response);
  });

  it("should do auth logout when server:loginRequired is true", async () => {
    await settingsStore.setLoginRequired(true);
    const { token, refreshToken } = await loginTestUser(request, "fakeuser");
    expect(authService.isJwtTokenBlacklisted(token)).toBeFalsy();
    const response = await request.post(logoutRoute).set("Authorization", `Bearer ${token}`).send();
    expectOkResponse(response);
    expect(authService.isJwtTokenBlacklisted(token)).toBeTruthy();
  });

  it("should get loginRequired", async () => {
    await settingsStore.setLoginRequired(true);
    await settingsStore.setRegistrationEnabled(true);
    const response = await request.get(`${baseRoute}/login-required`).send();
    expectOkResponse(response);
    expect(response.body.loginRequired).toBe(true);
    expect(response.body.wizardState.wizardCompleted).toBe(true);
    expect(response.body.registration).toBe(true);
    expect(response.body.isDemoMode).toBe(false);
  });

  it("should get verifyLogin", async () => {
    await settingsStore.setLoginRequired();
    const response = await request.post(verifyLoginRoute).send();
    expectUnauthenticatedResponse(response);

    await settingsStore.setLoginRequired(false);
    const response2 = await request.post(verifyLoginRoute).send();
    expectOkResponse(response2);
  });

  it("should get needsPasswordChange", async () => {
    // Not authenticated
    await settingsStore.setLoginRequired(true);
    const response = await request.post(needsPasswordChangeRoute).send();
    expectOkResponse(response);
    expect(response.body.needsPasswordChange).toBe(null);

    // No authentication required
    await settingsStore.setLoginRequired(false);
    const response2 = await request.post(needsPasswordChangeRoute).send();
    expectOkResponse(response2);
    expect(response2.body.needsPasswordChange).toBe(false);

    await settingsStore.setLoginRequired(false);
    const { token } = await loginTestUser(request);
    const response3 = await request.post(needsPasswordChangeRoute).set("Authorization", `Bearer ${token}`).send();
    expectOkResponse(response3);
    expect(response3.body.needsPasswordChange).toBe(false);

    await settingsStore.setLoginRequired(true);
    const response4 = await request.post(needsPasswordChangeRoute).set("Authorization", `Bearer ${token}`).send();
    expectOkResponse(response4);
    expect(response4.body.needsPasswordChange).toBe(false);
  });

  it("should refresh login", async () => {
    await settingsStore.setLoginRequired(true);
    await settingsStore.setRefreshTokenSettings({
      refreshTokenAttempts: 1,
      refreshTokenExpiry: 1000,
    });
    const { refreshToken } = await loginTestUser(request);
    const response = await request.post(`${baseRoute}/refresh`).send({ refreshToken });
    expectOkResponse(response);
    expect(response.body.token).toBeTruthy();
    const response2 = await request.post(`${baseRoute}/refresh`).send({ refreshToken });
    expectUnauthenticatedResponse(response2);
  });

  it("should not tolerate expired refresh token", async () => {
    await settingsStore.setLoginRequired(true);
    await settingsStore.setRefreshTokenSettings({
      refreshTokenAttempts: 1,
      refreshTokenExpiry: 0,
    });
    const { refreshToken } = await loginTestUser(request);
    const response = await request.post(`${baseRoute}/refresh`).send({ refreshToken });
    expectUnauthenticatedResponse(response);
  });

  it("should not tolerate non-existing refresh token", async () => {
    const response = await request.post(`${baseRoute}/refresh`).send({ refreshToken: "fake123" });
    expectUnauthenticatedResponse(response);
  });
});
