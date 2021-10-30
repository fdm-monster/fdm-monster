function serializePerm(group, perm) {
  return `${group}.${perm}`;
}

const PERM_GROUP = {
  PrinterFiles: "PrinterFiles"
};

const PERM = {
  PrinterFiles: {
    Default: serializePerm(PERM_GROUP.PrinterFiles, "Default"),
    List: serializePerm(PERM_GROUP.PrinterFiles, "List"),
    Delete: serializePerm(PERM_GROUP.PrinterFiles, "Delete"),
    Actions: serializePerm(PERM_GROUP.PrinterFiles, "Actions")
  }
};

function allPerms(group) {
  if (!group) throw new Error(`Permission group name '${group}' was not found`);
  return Object.values(PERM[group]);
}

const ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  GUEST: "GUEST"
};

const ROLE_PERMS = {
  [ROLES.ADMIN]: [allPerms(PERM_GROUP.PrinterFiles)],
  [ROLES.OPERATOR]: [allPerms(PERM_GROUP.PrinterFiles)],
  [ROLES.GUEST]: [PERM.PrinterFiles.Default]
};

module.exports = {
  ROLES,
  ROLE_PERMS
};
