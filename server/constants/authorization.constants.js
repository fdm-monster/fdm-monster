function serializePerm(group, perm) {
  return `${group}.${perm}`;
}

const PERM_GROUP = {
  PrinterFiles: "PrinterFiles"
};

const PERMS = {
  PrinterFiles: {
    Default: serializePerm(PERM_GROUP.PrinterFiles, "Default"),
    List: serializePerm(PERM_GROUP.PrinterFiles, "List"),
    Delete: serializePerm(PERM_GROUP.PrinterFiles, "Delete"),
    Actions: serializePerm(PERM_GROUP.PrinterFiles, "Actions")
  }
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
  GUEST: "GUEST"
};

const ROLE_PERMS = {
  [ROLES.ADMIN]: [allPerms(PERM_GROUP.PrinterFiles)],
  [ROLES.OPERATOR]: [allPerms(PERM_GROUP.PrinterFiles)],
  [ROLES.GUEST]: [PERMS.PrinterFiles.Default]
};

module.exports = {
  ROLES,
  PERMS,
  flattenPermissionDefinition,
  ROLE_PERMS
};
