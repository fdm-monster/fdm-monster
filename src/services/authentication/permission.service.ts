import { Permission } from "@/models";
import { flattenPermissionDefinition } from "@/constants/authorization.constants";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class PermissionService {
  private logger: LoggerService;

  constructor({ loggerFactory }: { loggerFactory: ILoggerFactory }) {
    this.logger = loggerFactory(PermissionService.name);
  }

  private _permissions: Record<string, any> = {};

  get permissions() {
    return this._permissions;
  }

  authorizePermission(requiredPermission: string, assignedPermissions: string[]) {
    return !!assignedPermissions.find((assignedPermission) => {
      const normalizePermission = this.#normalizePermission(assignedPermission);
      if (!normalizePermission) return false;
      return normalizePermission === requiredPermission;
    });
  }

  async getPermissionByName(permissionName: string) {
    const permission = await this.permissions.find((r) => r.name === permissionName);
    if (!permission) throw new NotFoundException("Permission not found");

    return permission;
  }

  async getPermission(permissionId) {
    const permission = await this.permissions.find((r) => r.id === permissionId);
    if (!permission) throw new NotFoundException(`Permission Id '${permissionId}' not found`);

    return permission;
  }

  async syncPermissions() {
    this._permissions = [];

    const permissionDefinition = flattenPermissionDefinition();
    for (let permission of permissionDefinition) {
      const storedPermission = await Permission.findOne({ name: permission });
      if (!storedPermission) {
        const newPermission = await Permission.create({
          name: permission,
        });
        this._permissions.push(newPermission);
      } else {
        this._permissions.push(storedPermission);
      }
    }
  }

  #normalizePermission(assignedPermission: string) {
    const permissionInstance = this.permissions.find((r) => r.id === assignedPermission || r.name === assignedPermission);
    if (!permissionInstance) {
      this.logger.warn(`The permission by ID ${assignedPermission} did not exist. Skipping.`);
      return;
    }
    return permissionInstance.name;
  }
}
