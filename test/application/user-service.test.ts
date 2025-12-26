import { ensureTestUserCreated } from "../api/test-data/create-user";
import { DITokens } from "@/container.tokens";
import { ROLES } from "@/constants/authorization.constants";
import { setupTestApp } from "../test-server";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { getDatasource } from "../typeorm.manager";
import { User } from "@/entities";
import { UserService } from "@/services/orm/user.service";

let userService: IUserService;
let roleService: IRoleService;

beforeAll(async () => {
  const { container } = await setupTestApp(true);
  userService = container.resolve(DITokens.userService);
  roleService = container.resolve(DITokens.roleService);
});

beforeEach(async () => {
  await getDatasource().getRepository(User).clear();
});

describe(UserService.name, () => {
  it("should get user", async () => {
    await roleService.syncRoles();
    const { id } = await ensureTestUserCreated();
    await userService.getUser(id);
  });

  it("should not get user by undefined id", async () => {
    await roleService.syncRoles();
    // @ts-ignore
    await expect(async () => await userService.getUser(undefined)).rejects.toBeDefined();
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
