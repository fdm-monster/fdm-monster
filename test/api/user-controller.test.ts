import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { expectForbiddenResponse, expectNotFoundResponse, expectOkResponse } from "../extensions";
import { ensureTestUserCreated } from "./test-data/create-user";
import { ROLES } from "@/constants/authorization.constants";
import { Test } from "supertest";
import { User } from "@/entities";
import { UserController } from "@/controllers/user.controller";
import { AwilixContainer } from "awilix";
import { SettingsStore } from "@/state/settings.store";
import { DITokens } from "@/container.tokens";
import { loginTestUser } from "./auth/login-test-user";
import { getDatasource } from "../typeorm.manager";
import TestAgent from "supertest/lib/agent";
import { IRoleService } from "@/services/interfaces/role-service.interface";

const defaultRoute = `${AppConstants.apiRoute}/user`;
const profileRoute = `${defaultRoute}/profile`;
const rolesRoute = `${defaultRoute}/roles`;
const getRoute = (id: number) => `${defaultRoute}/${id}`;
const changeUsernameRoute = (id: number) => `${defaultRoute}/${id}/change-username`;
const changePasswordRoute = (id: number) => `${defaultRoute}/${id}/change-password`;
const setVerifiedRoute = (id: number) => `${defaultRoute}/${id}/set-verified`;
const setUserRolesRoute = (id: number) => `${defaultRoute}/${id}/set-user-roles`;
const setRootUserRoute = (id: number) => `${defaultRoute}/${id}/set-root-user`;
const deleteRoute = (id: number) => `${defaultRoute}/${id}`;

let request: TestAgent<Test>;
let container: AwilixContainer;
let roleService: IRoleService;

beforeAll(async () => {
  ({ request, container } = await setupTestApp(true));
});

beforeEach(async () => {
  await container.resolve<SettingsStore>(DITokens.settingsStore).setLoginRequired(false);
  roleService = container.resolve<IRoleService>(DITokens.roleService);
});

describe(UserController.name, () => {
  it("GET profile", async () => {
    await ensureTestUserCreated();
    const response = await request.get(profileRoute).send();
    expectOkResponse(response);
  });

  it("GET profile with auth", async () => {
    await container.resolve<SettingsStore>(DITokens.settingsStore).setLoginRequired(true);
    const { token } = await loginTestUser(request, "test123456");
    const response = await request.get(profileRoute).set("Authorization", `Bearer ${token}`).send();
    expectOkResponse(response);
    expect(response.body.username).toBeTruthy();
  });

  it("GET roles", async () => {
    await ensureTestUserCreated();
    const response = await request.get(rolesRoute).send();
    expectOkResponse(response);
  });

  it("GET user should not expose passwordHash", async () => {
    const user = await ensureTestUserCreated();
    const response = await request.get(getRoute(user.id)).send();
    expectOkResponse(response);
    expect(response.body.passwordHash).toBeUndefined();
  });

  it("should return user list not exposing passwordHash", async function () {
    await ensureTestUserCreated();
    const response = await request.get(defaultRoute).send();
    expectOkResponse(response);
    expect(response.body?.length).toBeGreaterThanOrEqual(1);

    for (const user of response.body) {
      expect(user.passwordHash).toBeUndefined();
    }
  });

  it("should get user without passwordHash", async function () {
    const user = await ensureTestUserCreated();
    const response = await request.get(getRoute(user.id)).send();
    expectOkResponse(response, { username: expect.any(String) });

    // Password hash should not be sent
    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.roles).toHaveLength(1);
  });

  it("should delete existing non-root user", async function () {
    const user = await ensureTestUserCreated("test", "user", false, ROLES.OPERATOR, true, false);
    const response = await request.delete(deleteRoute(user.id)).send();
    expectOkResponse(response);

    const responseVerification = await request.get(getRoute(user.id)).send();
    expectNotFoundResponse(responseVerification);
  });

  it("should change username", async function () {
    const user = await ensureTestUserCreated("test", "user", false, ROLES.OPERATOR, true, true);
    const response = await request.post(changeUsernameRoute(user.id)).send({
      username: "newusername",
    });
    expectOkResponse(response);
  });

  it("should change password", async function () {
    const user = await ensureTestUserCreated("test", "user", false, ROLES.OPERATOR, true, true);
    const response = await request.post(changePasswordRoute(user.id)).send({
      oldPassword: "user",
      newPassword: "newpassword",
    });
    expectOkResponse(response);
  });

  it("should set verified", async function () {
    const user = await ensureTestUserCreated("test", "user", false, ROLES.OPERATOR, true, false);
    const response = await request.post(setVerifiedRoute(user.id)).send({
      isVerified: true,
    });
    expectOkResponse(response);
  });

  it("should create registered user", async function () {
    const response = await request.post(defaultRoute).send({
      username: "david",
      password: "test1234",
      roles: [ROLES.OPERATOR],
    });
    expectOkResponse(response);
  });

  it("should set user roles", async function () {
    const { token } = await loginTestUser(request, "fakeuser");

    const user = await ensureTestUserCreated("test", "user", false, ROLES.OPERATOR, true, false);
    const response = await request
      .post(setUserRolesRoute(user.id))
      .set("Authorization", `Bearer ${token}`)
      .send({
        roles: [ROLES.OPERATOR],
      });
    expectOkResponse(response);
    const getUser = await request.get(getRoute(user.id));
    expectOkResponse(getUser);
    expect(getUser.body.roles.includes(ROLES.OPERATOR)).toBeTruthy();
    expect(getUser.body.roles).toHaveLength(1);

    const response2 = await request.post(setUserRolesRoute(user.id)).set("Authorization", `Bearer ${token}`).send({
      roles: [],
    });
    expectOkResponse(response2);
    const getUser2 = await request.get(getRoute(user.id));
    expectOkResponse(getUser2);
    expect(getUser2.body.roles).toHaveLength(0);
  });

  it("should set root user", async function () {
    const user = await ensureTestUserCreated("test", "user", false, ROLES.OPERATOR, true, false);
    const response = await request.post(setRootUserRoute(user.id)).send({
      isRootUser: true,
    });
    expectOkResponse(response);
  });

  it("should not delete root user", async function () {
    const user123 = await ensureTestUserCreated("test456", "user", false, ROLES.OPERATOR, true, true);
    const user456 = await ensureTestUserCreated("test123", "user", false, ROLES.OPERATOR, true, true);
    const response = await request.delete(deleteRoute(user456.id)).send();
    expectForbiddenResponse(response);

    const responseVerification = await request.get(getRoute(user456.id)).send();
    const response2Verification = await request.get(getRoute(user123.id)).send();
    expectOkResponse(responseVerification);
    expectOkResponse(response2Verification);
  });

  it("should not delete last admin user", async function () {
    const userRepo = getDatasource().getRepository(User);
    const userCount = await userRepo.count();
    expect(userCount).toBeGreaterThan(0);
    await userRepo.clear();

    const user = await ensureTestUserCreated("test", "user", false, ROLES.ADMIN);
    const response = await request.delete(deleteRoute(user.id)).send();
    expectForbiddenResponse(response);

    const responseVerification = await request.get(getRoute(user.id)).send();
    expectOkResponse(responseVerification);
  });
});
