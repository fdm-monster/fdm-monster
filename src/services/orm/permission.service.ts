import { IPermissionService } from "@/services/interfaces/permission.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { BaseService } from "@/services/orm/base.service";
import { Permission } from "@/entities";
import { PermissionDto } from "@/services/interfaces/permission.dto";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { flattenPermissionDefinition } from "@/constants/authorization.constants";

export class PermissionService
  extends BaseService(Permission, PermissionDto<SqliteIdType>)
  implements IPermissionService<SqliteIdType, Permission>
{
  private logger: LoggerService;
  private _permissions: Permission[] = [];

  constructor({ loggerFactory, typeormService }: { loggerFactory: ILoggerFactory; typeormService: TypeormService }) {
    super({ typeormService });
  }
  get permissions() {
    return this._permissions;
  }

  toDto(permission: Permission): PermissionDto<SqliteIdType> {
    return {
      id: permission.id,
      name: permission.name,
    };
  }

  authorizePermission(requiredPermission: string, assignedPermissions: string[]): boolean {
    return !!assignedPermissions.find((assignedPermission) => {
      const normalizePermission = this.normalizePermission(assignedPermission);
      if (!normalizePermission) return false;
      return normalizePermission === requiredPermission;
    });
  }

  async getPermissionByName(permissionName: string): Promise<Permission> {
    const permission = this.permissions.find((r) => r.name === permissionName);
    if (!permission) throw new NotFoundException("Permission not found");
    return permission;
  }

  async getPermission(permissionId: SqliteIdType): Promise<Permission> {
    const permission = this.permissions.find((r) => r.id === permissionId);
    if (!permission) throw new NotFoundException(`Permission by provided id is not found`);

    return permission;
  }

  async syncPermissions(): Promise<void> {
    this._permissions = [];

    const permissionDefinition = flattenPermissionDefinition();
    for (let permission of permissionDefinition) {
      const storedPermission = await this.repository.findOneBy({ name: permission });
      if (!storedPermission) {
        const newPermission = await this.create({
          name: permission,
        });
        this._permissions.push(newPermission);
      } else {
        this._permissions.push(storedPermission);
      }
    }
  }

  normalizePermission(assignedPermission: string | number): string {
    const permissionInstance = this.permissions.find((r) => r.id === assignedPermission || r.name === assignedPermission);
    if (!permissionInstance) {
      this.logger.warn(`The permission by provided id is not found. Skipping`);
      return;
    }
    return permissionInstance.name;
  }
}
