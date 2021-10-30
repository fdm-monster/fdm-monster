const { ROLES, flattenPermissionDefinition } = require("../../constants/authorization.constants");
const PermissionModel = require("../../models/Auth/Permission");
const { NotFoundException } = require("../../exceptions/runtime.exceptions");
const ObjectID = require("mongodb").ObjectID;

class PermissionService {
  #permissions = {};
  #logger;

  constructor({ loggerFactory }) {
    this.#logger = loggerFactory("RoleService");
  }

  get permissions() {
    return this.#permissions;
  }

  #normalizeRole(assignedPermission) {
    if (ObjectID.isValid(assignedPermission)) {
      const permissionInstance = this.permissions.find((r) => r.id === assignedPermission);
      if (!permissionInstance) {
        console.warn(`The permission by ID ${assignedPermission} did not exist. Skipping.`);
        return;
      }
      return permissionInstance.name;
    } else if (Object.values(ROLES).includes(assignedPermission)) {
      return assignedPermission;
    } else {
      console.warn(
        `The permission by Name ${assignedPermission} did not exist in definition. Skipping.`
      );
    }
  }

  authorizePermission(requiredRole, assignedRoles) {
    return !!assignedRoles.find((assignedPermission) => {
      const normalizePermission = this.#normalizeRole(assignedPermission);
      if (!normalizePermission) return false;
      return normalizePermission === requiredRole;
    });
  }

  authorizePermissions(requiredPermissions, assignedPermissions) {
    let isAuthorized = false;

    if (!requiredPermissions?.length) return true;
    requiredPermissions.forEach((requiredPermission) => {
      const result = this.authorizePermission(requiredPermission, assignedPermissions);
      isAuthorized = isAuthorized && result;
    });

    return isAuthorized;
  }

  async getPermissionByName(permissionName) {
    const permission = await this.permissions.find((r) => r.name === permissionName);
    if (!permission) throw new NotFoundException("Permission not found");

    return permission;
  }

  async getPermission(permissionId) {
    const role = await this.permissions.find((r) => r.id === permissionId);
    if (!role) throw new NotFoundException(`Permission Id '${permissionId}' not found`);

    return role;
  }

  async syncPermissions() {
    this.#permissions = [];
    const permissionDefinition = flattenPermissionDefinition();
    console.log(permissionDefinition);

    for (let permission of permissionDefinition) {
      const storedPermission = await PermissionModel.findOne({ name: permission });
      if (!storedPermission) {
        const newPermission = await PermissionModel.create({
          name: permission
        });
        this.#permissions.push(newPermission);
      } else {
        this.#permissions.push(storedPermission);
      }
    }
  }
}

module.exports = PermissionService;
