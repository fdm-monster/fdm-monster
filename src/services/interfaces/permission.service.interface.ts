import { IdType } from "@/shared.constants";
import { IPermission } from "@/models/Auth/Permission";
import { PermissionDto } from "@/services/interfaces/permission.dto";

export interface IPermissionService<KeyType = IdType, Entity = IPermission> {
  get permissions(): PermissionDto<KeyType>[];

  toDto(permission: Entity): PermissionDto<KeyType>;

  authorizePermission(requiredPermission: string, assignedPermissions: string[]): boolean;

  getPermissionByName(permissionName: string): Promise<Entity>;

  getPermission(permissionId: KeyType): Promise<Entity>;

  syncPermissions(): Promise<void>;

  normalizePermission(assignedPermission: string): string | undefined;
}
