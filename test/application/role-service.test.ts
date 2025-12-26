import { configureContainer } from "@/container";
import { ROLES } from "@/constants/authorization.constants";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { Role } from "@/entities";
import { RoleService } from "@/services/orm/role.service";

let container: AwilixContainer;
let typeorm: TypeormService;
let roleService: IRoleService;

beforeAll(async () => {
  container = configureContainer();
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  roleService = container.resolve(DITokens.roleService);

  await typeorm.createConnection();
});
afterEach(async () => {
  await typeorm.getDataSource().getRepository(Role).clear();
});

describe(RoleService.name, () => {
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
