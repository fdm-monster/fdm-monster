import type { IPermissionService } from "@/services/interfaces/permission.service.interface";
import { flattenPermissionDefinition } from "@/constants/authorization.constants";
import type { PermissionName } from "@/constants/authorization.constants";

export class PermissionService implements IPermissionService {
  private _permissions: PermissionName[] = [];

  get permissions(): PermissionName[] {
    return this._permissions;
  }

  authorizePermission(requiredPermission: PermissionName, assignedPermissions: PermissionName[]): boolean {
    return assignedPermissions.includes(requiredPermission);
  }

  async syncPermissions(): Promise<void> {
    this._permissions = flattenPermissionDefinition();
  }
}
