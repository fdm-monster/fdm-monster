import { ensureTestUserCreated } from "../api/test-data/create-user";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { ROLES } from "@/constants/authorization.constants";
import { AwilixContainer } from "awilix";
import { UserService } from "@/services/authentication/user.service";
import { RoleService } from "@/services/authentication/role.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";

let container: AwilixContainer;
let userService: UserService;
let roleService: RoleService;

beforeAll(async () => {
  container = configureContainer(true);
  userService = container.resolve(DITokens.userService);
  roleService = container.resolve(DITokens.roleService);

  let typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  await typeorm.createConnection();
});

describe(UserService.name, () => {
  it("should get user ", async () => {
    await roleService.syncRoles();
    const { id } = await ensureTestUserCreated();
    await userService.getUser(id);
  });

  it("should find no user by role id ", async () => {
    await roleService.syncRoles();
    const role = roleService.getRoleByName(ROLES.ADMIN);
    const result = await userService.findUserByRoleId(role.id);
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
    const userRoles = await userService.getUserRoleIds(id);
    expect(userRoles).toHaveLength(1);
  });
});
