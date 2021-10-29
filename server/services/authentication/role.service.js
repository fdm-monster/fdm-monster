const { ROLES } = require("../../constants/service.constants");
const RoleModel = require("../../models/Auth/Role");
const { NotFoundException } = require("../../exceptions/runtime.exceptions");

class RoleService {
  #roles = [];

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

  async getRoleByName(roleName) {
    const role = await this.#roles.find((r) => r.name === roleName);
    if (!role) throw new NotFoundException("Role not found");

    return role;
  }

  async getRole(roleId) {
    const role = await this.#roles.find((r) => r.id === roleId);
    if (!role) throw new NotFoundException("Role not found");

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
      }
      else {
        this.#roles.push(storedRole);
      }
    }
  }
}

module.exports = RoleService;
