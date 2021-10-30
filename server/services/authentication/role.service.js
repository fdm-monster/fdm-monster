const { ROLES } = require("../../constants/authorization.constants");
const RoleModel = require("../../models/Auth/Role");
const { NotFoundException } = require("../../exceptions/runtime.exceptions");
const ObjectID = require("mongodb").ObjectID;

class RoleService {
  #roles = [];
  #logger;

  constructor({ loggerFactory }) {
    this.#logger = loggerFactory("RoleService");
  }

  get roles() {
    return this.#roles;
  }

  async getDefaultRoles() {
    if (!this.#roles?.length) {
      await this.syncRoles();
    }

    const guestRole = await this.getRoleByName(ROLES.GUEST);
    return [guestRole.id];
  }

  #normalizeRole(assignedRole) {
    if (ObjectID.isValid(assignedRole)) {
      const roleInstance = this.roles.find((r) => r.id === assignedRole);
      if (!roleInstance) {
        console.warn(`The role by ID ${assignedRole} did not exist. Skipping.`);
        return;
      }
      return roleInstance.name;
    } else if (Object.values(ROLES).includes(assignedRole)) {
      return assignedRole;
    } else {
      console.warn(`The role by Name ${assignedRole} did not exist in definition. Skipping.`);
    }
  }

  authorizeRole(requiredRole, assignedRoles) {
    return !!assignedRoles.find((ar) => {
      const normalizedRole = this.#normalizeRole(ar);
      if (!normalizedRole) return false;
      return normalizedRole === requiredRole;
    });
  }

  authorizeRoles(requiredRoles, assignedRoles, subset = true) {
    let isAuthorized = false;

    if (!requiredRoles?.length) return true;
    requiredRoles.forEach((rr) => {
      const result = this.authorizeRole(rr, assignedRoles);
      isAuthorized = subset ? isAuthorized || result : isAuthorized && result;
    });

    return isAuthorized;
  }

  async getRoleByName(roleName) {
    const role = await this.#roles.find((r) => r.name === roleName);
    if (!role) throw new NotFoundException("Role not found");

    return role;
  }

  async getRole(roleId) {
    const role = await this.#roles.find((r) => r.id === roleId);
    if (!role) throw new NotFoundException(`Role Id '${roleId}' not found`);

    return role;
  }

  async syncRoles() {
    this.#roles = [];
    for (let roleName of Object.values(ROLES)) {
      const storedRole = await RoleModel.findOne({ name: roleName });
      if (!storedRole) {
        const newRole = await RoleModel.create({
          name: roleName
        });
        this.#roles.push(newRole);
      } else {
        this.#roles.push(storedRole);
      }
    }
  }
}

module.exports = RoleService;
