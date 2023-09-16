import { connect, closeDatabase } from "../db-handler";
import { ensureTestUserCreated } from "../api/test-data/create-user";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { User } from "@/models";
import { ROLES } from "@/constants/authorization.constants";
import { AwilixContainer } from "awilix";
import { UserService } from "@/services/authentication/user.service";
import { RoleService } from "@/services/authentication/role.service";

let container: AwilixContainer;
let userService: UserService;
let roleService: RoleService;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  userService = container.resolve(DITokens.userService);
  roleService = container.resolve(DITokens.roleService);
});
afterEach(async () => {
  await User.deleteMany();
});
afterAll(async () => {
  await closeDatabase();
});

describe("UserService", () => {
  it("should get user ", async () => {
    await roleService.syncRoles();
    const { id } = await ensureTestUserCreated();
    await userService.getUser(id);
  });

  it("should find no user by role id ", async () => {
    await roleService.syncRoles();
    const role = roleService.getRoleByName(ROLES.ADMIN);
    const result = await userService.findRawByRoleId(role.id);
    expect(result?.length).toBeFalsy();
  });

  it("should get users", async () => {
    await ensureTestUserCreated();
    const users = await userService.listUsers(5);
    expect(users.length).toBeGreaterThanOrEqual(1);
  });

  it("should get user roles", async () => {
    await roleService.syncRoles();
    const { id } = await ensureTestUserCreated();
    const userRoles = await userService.getUserRoles(id);
    expect(userRoles).toHaveLength(1);
  });
});
