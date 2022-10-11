const { union } = require("lodash");

function serializePerm(group, perm) {
  return `${group}.${perm}`;
}

const PERM_GROUP = {
  Alerts: "Alerts",
  PrinterFiles: "PrinterFiles",
  PrinterSettings: "PrinterSettings",
  PrinterGroups: "PrinterGroups",
  PrinterFloors: "PrinterFloors",
  ServerInfo: "ServerInfo",
};

const PERMS = {
  Alerts: {
    Test: serializePerm(PERM_GROUP.Alerts, "Test"),
  },
  [PERM_GROUP.PrinterFiles]: {
    Default: serializePerm(PERM_GROUP.PrinterFiles, "Default"),
    Get: serializePerm(PERM_GROUP.PrinterFiles, "Get"),
    Delete: serializePerm(PERM_GROUP.PrinterFiles, "Delete"),
    Clear: serializePerm(PERM_GROUP.PrinterFiles, "Clear"),
    Upload: serializePerm(PERM_GROUP.PrinterFiles, "Upload"),
    Actions: serializePerm(PERM_GROUP.PrinterFiles, "Actions"),
  },
  [PERM_GROUP.PrinterGroups]: {
    Default: serializePerm(PERM_GROUP.PrinterGroups, "Default"),
    List: serializePerm(PERM_GROUP.PrinterGroups, "List"),
    Get: serializePerm(PERM_GROUP.PrinterGroups, "Get"),
    Create: serializePerm(PERM_GROUP.PrinterGroups, "Create"),
    Update: serializePerm(PERM_GROUP.PrinterGroups, "Update"),
    Delete: serializePerm(PERM_GROUP.PrinterGroups, "Delete"),
  },
  [PERM_GROUP.PrinterFloors]: {
    Default: serializePerm(PERM_GROUP.PrinterFloors, "Default"),
    List: serializePerm(PERM_GROUP.PrinterFloors, "List"),
    Get: serializePerm(PERM_GROUP.PrinterFloors, "Get"),
    Create: serializePerm(PERM_GROUP.PrinterFloors, "Create"),
    Update: serializePerm(PERM_GROUP.PrinterFloors, "Update"),
    Delete: serializePerm(PERM_GROUP.PrinterFloors, "Delete"),
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

function flattenPermissionDefinition() {
  const permissions = [];
  for (let key of Object.values(PERM_GROUP)) {
    for (let permissionName of Object.values(PERMS[key])) {
      permissions.push(permissionName);
    }
  }

  return permissions;
}

function allPerms(group) {
  if (!group) throw new Error(`Permission group name '${group}' was not found`);
  return Object.values(PERMS[group]);
}

const ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  GUEST: "GUEST",
};

const ROLE_PERMS = {
  [ROLES.ADMIN]: union(
    allPerms(PERM_GROUP.Alerts),
    allPerms(PERM_GROUP.PrinterFloors),
    allPerms(PERM_GROUP.PrinterFiles),
    allPerms(PERM_GROUP.PrinterGroups),
    allPerms(PERM_GROUP.PrinterSettings),
    allPerms(PERM_GROUP.ServerInfo)
  ),
  [ROLES.OPERATOR]: union(
    allPerms(PERM_GROUP.PrinterFiles),
    allPerms(PERM_GROUP.PrinterGroups),
    allPerms(PERM_GROUP.PrinterFloors)
  ),
  [ROLES.GUEST]: [PERMS.PrinterFiles.Default, PERMS.PrinterFiles.Upload, PERMS.PrinterGroups.List],
};

module.exports = {
  ROLES,
  PERMS,
  flattenPermissionDefinition,
  ROLE_PERMS,
};
