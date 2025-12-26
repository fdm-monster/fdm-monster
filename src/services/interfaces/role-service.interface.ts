import { RoleDto } from "@/services/interfaces/role.dto";
import { Role } from "@/entities";
import { PermissionName, RoleName } from "@/constants/authorization.constants";

export interface IRoleService<Entity = Role> {
  toDto(role: Entity): RoleDto;

  get roles(): Entity[];

  getAppDefaultRole(): Promise<RoleName>;

  getAppDefaultRoleNames(): Promise<RoleName[]>;

  getRolesPermissions(roleNames: RoleName[]): PermissionName[];

  getRolePermissions(roleName: RoleName): PermissionName[];

  getSynchronizedRoleByName(roleName: RoleName): Promise<Entity>;

  authorizeRole(requiredRole: RoleName, assignedRoles: RoleName[]): boolean;

  authorizeRoles(requiredRoles: RoleName[], assignedRoles: RoleName[], subset: boolean): boolean;

  getRoleByName(roleName: RoleName): Entity;

  getManyRoles(roleIds: number[]): Entity[];

  getRole(roleId: number): Entity;

  roleIdsToRoleNames(roleIds: number[]): RoleName[];

  syncRoles(): Promise<void>;
}
