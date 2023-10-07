import { IdType, MongoIdType } from "@/shared.constants";
import { IPermission } from "@/models/Auth/Permission";
import { PermissionDto } from "@/services/interfaces/permission.dto";

export interface IPermissionService<KeyType = IdType> {
  toDto(permission: IPermission): PermissionDto<KeyType>;

  authorizePermission(requiredPermission: string, assignedPermissions: string[]): boolean;

  getPermissionByName(permissionName: string): Promise<IPermission>;

  getPermission(permissionId: MongoIdType): Promise<IPermission>;

  syncPermissions(): Promise<void>;

  normalizePermission(assignedPermission: string): string;
}
