import { union } from "lodash";

export const AUTH_ERROR_REASON = {
  // Before login
  IncorrectCredentials: "IncorrectCredentials",
  InvalidOrExpiredRefreshToken: "InvalidOrExpiredRefreshToken",
  InvalidOrExpiredAuthToken: "InvalidOrExpiredAuthToken",
  PasswordChangeRequired: "PasswordChangeRequired",
  LoginRequired: "LoginRequired",
  AccountNotVerified: "AccountNotVerified",
};

export const PERM_GROUP = {
  PrinterFiles: "PrinterFiles",
  PrinterSettings: "PrinterSettings",
  Floors: "Floors",
  PrintCompletion: "PrintCompletion",
  ServerInfo: "ServerInfo",
} as const;

export type PermissionGroup = (typeof PERM_GROUP)[keyof typeof PERM_GROUP];

export const PERMS = {
  [PERM_GROUP.PrinterFiles]: {
    Default: "PrinterFiles.Default",
    Get: "PrinterFiles.Get",
    Delete: "PrinterFiles.Delete",
    Clear: "PrinterFiles.Clear",
    Upload: "PrinterFiles.Upload",
    Actions: "PrinterFiles.Actions",
  },
  [PERM_GROUP.PrintCompletion]: {
    Default: "PrintCompletion.Default",
    List: "PrintCompletion.List",
  },
  [PERM_GROUP.Floors]: {
    Default: "Floors.Default",
    List: "Floors.List",
    Get: "Floors.Get",
    Create: "Floors.Create",
    Update: "Floors.Update",
    Delete: "Floors.Delete",
  },
  [PERM_GROUP.PrinterSettings]: {
    Default: "PrinterSettings.Default",
    Get: "PrinterSettings.Get",
  },
  [PERM_GROUP.ServerInfo]: {
    Default: "ServerInfo.Default",
    Get: "ServerInfo.Get",
  },
} as const;

type ExtractPerms<T> = T extends Record<string, string> ? T[keyof T] : never;
type PermsType = typeof PERMS;
export type PermissionName = ExtractPerms<PermsType[keyof PermsType]>;

export function flattenPermissionDefinition(): PermissionName[] {
  const permissions: PermissionName[] = [];
  for (const key of Object.values(PERM_GROUP)) {
    for (const permissionName of Object.values(PERMS[key])) {
      permissions.push(permissionName);
    }
  }
  return permissions;
}

export function allPerms(group: PermissionGroup): PermissionName[] {
  if (!group || !PERMS[group]) throw new Error(`Permission group name '${group}' was not found`);
  return Object.values(PERMS[group]) as PermissionName[];
}

export const ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  GUEST: "GUEST",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMS: Record<RoleName, PermissionName[]> = {
  [ROLES.ADMIN]: union(
    allPerms(PERM_GROUP.Floors),
    allPerms(PERM_GROUP.PrinterFiles),
    allPerms(PERM_GROUP.PrintCompletion),
    allPerms(PERM_GROUP.PrinterSettings),
    allPerms(PERM_GROUP.ServerInfo),
  ),
  [ROLES.OPERATOR]: union(
    allPerms(PERM_GROUP.Floors),
    allPerms(PERM_GROUP.PrinterFiles),
    allPerms(PERM_GROUP.PrintCompletion),
    allPerms(PERM_GROUP.PrinterSettings),
  ),
  [ROLES.GUEST]: [],
};
