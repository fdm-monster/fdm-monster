import { IdType } from "@/shared.constants";
import { RoleDto } from "@/services/interfaces/role.dto";
import { Role } from "@/entities";

export interface IRoleService<KeyType = IdType, Entity = Role> {
  toDto(role: Entity): RoleDto<KeyType>;

  get roles(): Entity[];

  getAppDefaultRole(): Promise<string>;

  getRolesPermissions(roles: (string | KeyType)[]): string[];

  getRolePermissions(role: string | KeyType): string[];

  getAppDefaultRoleIds(): Promise<any[]>;

  getSynchronizedRoleByName(roleName: string): Promise<Entity>;

  authorizeRole(requiredRole: string | KeyType, assignedRoles: string[]): boolean;

  authorizeRoles(requiredRoles: (string | KeyType)[], assignedRoles: readonly (string | KeyType)[], subset: boolean): boolean;

  getRoleByName(roleName: string): Entity;

  getManyRoles(roleIds: KeyType[]): Entity[];

  getRole(roleId: KeyType): Entity;

  syncRoles(): Promise<void>;
}
