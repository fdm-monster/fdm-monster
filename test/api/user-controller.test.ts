import { connect } from "../db-handler";
import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import {
  expectBadRequestError,
  expectForbiddenResponse,
  expectInternalServerError,
  expectNotFoundResponse,
  expectOkResponse,
  expectUnauthorizedResponse,
} from "../extensions";
import { ensureTestUserCreated } from "./test-data/create-user";
import { ROLES } from "@/constants/authorization.constants";
import supertest from "supertest";
import { User } from "@/models";
import { UserController } from "@/controllers/user.controller";

const defaultRoute = `${AppConstants.apiRoute}/user`;
const profileRoute = `${defaultRoute}/profile`;
const rolesRoute = `${defaultRoute}/roles`;
const getRoute = (id: string) => `${defaultRoute}/${id}`;
const deleteRoute = (id: string) => `${defaultRoute}/${id}`;

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  await connect();
  ({ request } = await setupTestApp(true));
});

describe(UserController.name, () => {
  it("GET profile", async () => {
    await ensureTestUserCreated();
    const response = await request.get(profileRoute).send();
    expectOkResponse(response);
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

  it("should delete existing user", async function () {
    const user = await ensureTestUserCreated("test", "user", false, ROLES.OPERATOR, true, false);
    const response = await request.delete(deleteRoute(user.id)).send();
    expectOkResponse(response);

    const responseVerification = await request.get(getRoute(user.id)).send();
    expectNotFoundResponse(responseVerification);
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
    await User.deleteMany({});
    const user = await ensureTestUserCreated("test", "user", false, ROLES.ADMIN);
    const response = await request.delete(deleteRoute(user.id)).send();
    expectForbiddenResponse(response);

    const responseVerification = await request.get(getRoute(user.id)).send();
    expectOkResponse(responseVerification);
  });
});
