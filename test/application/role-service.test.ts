import { configureContainer } from "@/container";
import { Role } from "@/models";
import { ROLES } from "@/constants/authorization.constants";
import { DITokens } from "@/container.tokens";
import { RoleService } from "@/services/authentication/role.service";
import { AwilixContainer } from "awilix";
import { connect, closeDatabase } from "../db-handler";

let container: AwilixContainer;
let roleService: RoleService;

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
