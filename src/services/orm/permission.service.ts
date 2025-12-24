import { IPermissionService } from "@/services/interfaces/permission.service.interface";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { flattenPermissionDefinition } from "@/constants/authorization.constants";

export class Permission {
  name: string;
}

export class PermissionService implements IPermissionService {
  private _permissions: Permission[] = [];
  private readonly logger: LoggerService;

  constructor(loggerFactory: ILoggerFactory) {
    this.logger = loggerFactory(PermissionService.name);
  }

  get permissions() {
    return this._permissions;
  }

  authorizePermission(requiredPermission: string, assignedPermissions: string[]): boolean {
    return !!assignedPermissions.find((assignedPermission) => {
      const normalizePermission = this.normalizePermission(assignedPermission);
      if (!normalizePermission) return false;
      return normalizePermission === requiredPermission;
    });
  }

  normalizePermission(assignedPermission: string) {
    const permissionInstance = this.permissions.find(
      (r) => r.name === assignedPermission,
    );
    if (!permissionInstance) {
      this.logger.warn(`The permission by provided id is not found. Skipping`);
      return;
    }
    return permissionInstance.name;
  }

  async syncPermissions(): Promise<void> {
    this._permissions = [];

    const permissionDefinition = flattenPermissionDefinition();
    for (let permission of permissionDefinition) {
      this._permissions.push({name: permission});
    }
  }
}
