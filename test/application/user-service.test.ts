import { ensureTestUserCreated } from "../api/test-data/create-user";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { ROLES } from "@/constants/authorization.constants";
import { AwilixContainer } from "awilix";
import { UserService } from "@/services/authentication/user.service";
import { RoleService } from "@/services/authentication/role.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { setupTestApp } from "../test-server";
import { SqliteIdType } from "@/shared.constants";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { RoleDto } from "@/services/interfaces/role.dto";
import { UserDto } from "@/services/interfaces/user.dto";

let container: AwilixContainer;
let userService: IUserService<SqliteIdType, UserDto<SqliteIdType>>;
let roleService: IRoleService<SqliteIdType, RoleDto<SqliteIdType>>;

beforeAll(async () => {
  const { container, httpClient: axiosMock } = await setupTestApp(true);
  userService = container.resolve(DITokens.userService);
  roleService = container.resolve(DITokens.roleService);
});

beforeEach(async () => {
  const users = await userService.listUsers();
  for (let user of users) {
    await userService.deleteUser(user.id);
  }
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
    const result = await userService.findUsersByRoleId(role.id);
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
