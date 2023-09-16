const { union } = require("lodash");

function serializePerm(group, perm) {
  return `${group}.${perm}`;
}

const PERM_GROUP = {
  PrinterFiles: "PrinterFiles",
  PrinterSettings: "PrinterSettings",
  Floors: "PrinterFloors", // TODO rename in migration or seed
  PrintCompletion: "PrintCompletion",
  ServerInfo: "ServerInfo",
};

const PERMS = {
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
  if (!group || !PERMS[group]) throw new Error(`Permission group name '${group}' was not found`);
  return Object.values(PERMS[group]);
}

const ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  GUEST: "GUEST",
};

const ROLE_PERMS = {
  [ROLES.ADMIN]: union(
    allPerms(PERM_GROUP.Floors),
    allPerms(PERM_GROUP.PrinterFiles),
    allPerms(PERM_GROUP.PrintCompletion),
    allPerms(PERM_GROUP.PrinterSettings),
    allPerms(PERM_GROUP.ServerInfo)
  ),
  [ROLES.OPERATOR]: union(allPerms(PERM_GROUP.PrinterFiles), allPerms(PERM_GROUP.PrintCompletion), allPerms(PERM_GROUP.Floors)),
  [ROLES.GUEST]: [],
};

module.exports = {
  ROLES,
  PERMS,
  flattenPermissionDefinition,
  allPerms,
  ROLE_PERMS,
};
