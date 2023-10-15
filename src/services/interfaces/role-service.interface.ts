import { IdType } from "@/shared.constants";
import { IRole } from "@/models/Auth/Role";
import { RoleDto } from "@/services/interfaces/role.dto";

export interface IRoleService<KeyType = IdType, Entity = IRole> {
  toDto(role: Entity): RoleDto<KeyType>;

  get roles(): Entity[];

  getAppDefaultRole(): Promise<string>;

  getRolesPermissions(roles: string[]): string[];

  getRolePermissions(role: string): string[];

  getAppDefaultRoleIds(): Promise<any[]>;

  getSynchronizedRoleByName(roleName: string): Promise<Entity>;

  authorizeRole(requiredRole: string, assignedRoles: string[]): boolean;

  authorizeRoles(requiredRoles: string[], assignedRoles: string[], subset: boolean): boolean;

  getRoleByName(roleName: string): Entity;

  getManyRoles(roleIds: KeyType[]): Entity[];

  getRole(roleId: KeyType): Entity;

  syncRoles(): Promise<void>;

  normalizeRoleIdOrName(assignedRole: string | KeyType): string | undefined;
}
