export interface IPermissionService {
  authorizePermission(requiredPermission: string, assignedPermissions: string[]): boolean;
  syncPermissions(): Promise<void>;
  normalizePermission(assignedPermission: string): string | undefined;
}
