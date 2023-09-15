const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");
const RoleModel = require("../../models/Auth/Role");
const { ROLES } = require("../../constants/authorization.constants");

let container;
let roleService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  roleService = container.resolve(DITokens.roleService);
});
afterEach(async () => {
  await RoleModel.deleteMany();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
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
