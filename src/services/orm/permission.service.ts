import { IPermissionService } from "@/services/interfaces/permission.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { BaseService } from "@/services/orm/base.service";
import { Permission } from "@/entities";
import { PermissionDto } from "@/services/interfaces/permission.dto";

export class PermissionService
  extends BaseService(Permission, PermissionDto<SqliteIdType>)
  implements IPermissionService<SqliteIdType, Permission>
{
  authorizePermission(requiredPermission: string, assignedPermissions: string[]): boolean {
    return false;
  }

  getPermission(permissionId: SqliteIdType): Promise<Permission> {
    return Promise.resolve(undefined);
  }

  getPermissionByName(permissionName: string): Promise<Permission> {
    return Promise.resolve(undefined);
  }

  normalizePermission(assignedPermission: string): string {
    return "";
  }

  syncPermissions(): Promise<void> {
    return Promise.resolve(undefined);
  }

  toDto(permission: Permission): PermissionDto<SqliteIdType> {
    return {
      id: permission.id,
      name: permission.name,
    };
  }
}
