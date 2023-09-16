import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import { configureContainer } from "@/container";
import { Role } from "@/models";
import { ROLES } from "@/constants/authorization.constants";
import { DITokens } from "../../server/container.tokens";
const { connect, closeDatabase } = require("../db-handler");

let container;
let roleService;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  roleService = container.resolve(DITokens.roleService);
});
afterEach(async () => {
  await Role.deleteMany();
});
afterAll(async () => {
  await closeDatabase();
});

describe("RoleService", () => {
  it("should sync definition to database", async () => {
    await roleService.syncRoles();
    expect(roleService.roles).toHaveLength(Object.values(ROLES).length);
  });

  it("should get exact ", async () => {
    await roleService.syncRoles();
    const roles = roleService.roles;
    await roleService.getRole(roles[0].id);
  });

  it("should resolve guest role", async () => {
    await roleService.getRoleByName(ROLES.GUEST);
  });
});
