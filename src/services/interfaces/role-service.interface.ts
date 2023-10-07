import { IdType } from "@/shared.constants";
import { IRole } from "@/models/Auth/Role";

export interface IRoleService<KeyType = IdType> {
  getAppDefaultRole(): Promise<string>;

  getRolesPermissions(roles: string[]): string[];

  getRolePermissions(role: string): string[];

  getAppDefaultRoleIds(): Promise<any[]>;

  getSynchronizedRoleByName(roleName: string): Promise<IRole>;

  authorizeRole(requiredRole: string, assignedRoles: string[]): boolean;

  authorizeRoles(requiredRoles: string[], assignedRoles: string[], subset: boolean): boolean;

  getRoleByName(roleName: string): IRole;

  getManyRoles(roleIds: KeyType[]): IRole[];

  getRole(roleId: KeyType): IRole;

  syncRoles(): Promise<void>;

  normalizeRoleIdOrName(assignedRole: string | KeyType): string | undefined;
}
