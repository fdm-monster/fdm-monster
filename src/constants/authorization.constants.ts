import { union } from "lodash";

export function serializePerm(group: string, perm: string) {
  return `${group}.${perm}`;
}

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
  Floors: "PrinterFloors", // TODO rename in migration or seed
  PrintCompletion: "PrintCompletion",
  ServerInfo: "ServerInfo",
};

export const PERMS: Record<string, Record<string, string>> = {
  [PERM_GROUP.PrinterFiles]: {
    Default: serializePerm(PERM_GROUP.PrinterFiles, "Default"),
    Get: serializePerm(PERM_GROUP.PrinterFiles, "Get"),
    Delete: serializePerm(PERM_GROUP.PrinterFiles, "Delete"),
    Clear: serializePerm(PERM_GROUP.PrinterFiles, "Clear"),
    Upload: serializePerm(PERM_GROUP.PrinterFiles, "Upload"),
    Actions: serializePerm(PERM_GROUP.PrinterFiles, "Actions"),
  },
  [PERM_GROUP.PrintCompletion]: {
    Default: serializePerm(PERM_GROUP.PrintCompletion, "Default"),
    List: serializePerm(PERM_GROUP.PrintCompletion, "List"),
  },
  [PERM_GROUP.Floors]: {
    Default: serializePerm(PERM_GROUP.Floors, "Default"),
    List: serializePerm(PERM_GROUP.Floors, "List"),
    Get: serializePerm(PERM_GROUP.Floors, "Get"),
    Create: serializePerm(PERM_GROUP.Floors, "Create"),
    Update: serializePerm(PERM_GROUP.Floors, "Update"),
    Delete: serializePerm(PERM_GROUP.Floors, "Delete"),
  },
  [PERM_GROUP.PrinterSettings]: {
    Default: serializePerm(PERM_GROUP.PrinterSettings, "Default"),
    Get: serializePerm(PERM_GROUP.PrinterSettings, "Get"),
  },
  [PERM_GROUP.ServerInfo]: {
    Default: serializePerm(PERM_GROUP.ServerInfo, "Default"),
    Get: serializePerm(PERM_GROUP.ServerInfo, "Get"),
  },
};

export function flattenPermissionDefinition() {
  const permissions = [];
  for (let key of Object.values(PERM_GROUP)) {
    for (let permissionName of Object.values(PERMS[key])) {
      permissions.push(permissionName);
    }
  }

  return permissions;
}

export function allPerms(group: string) {
  if (!group || !PERMS[group]) throw new Error(`Permission group name '${group}' was not found`);
  return Object.values(PERMS[group]);
}

export const ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  GUEST: "GUEST",
};

export const ROLE_PERMS: Record<string, string[]> = {
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
