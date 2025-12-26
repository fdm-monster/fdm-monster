import { PermissionName } from "@/constants/authorization.constants";

export interface IPermissionService {
  authorizePermission(requiredPermission: PermissionName, assignedPermissions: PermissionName[]): boolean;
  syncPermissions(): Promise<void>;
}
