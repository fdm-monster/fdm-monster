const { ROLES } = require("../../constants/service.constants");
const RoleModel = require("../../models/Auth/Role");
const { NotFoundException } = require("../../exceptions/runtime.exceptions");

class RoleService {
  #roles = [];

  async getRoleByName(roleName) {
    const role = await this.#roles.find((r) => r.name === roleName);
    if (!role) throw new NotFoundException("Role not found");

    return role;
  }

  async getRole(roleId) {
    const role = await this.#roles.find((r) => r._id === roleId);
    if (!role) throw new NotFoundException("Role not found");

    return role;
  }

  async syncRoles() {
    this.#roles = [];
    for (let role of Object.values(ROLES)) {
      const newRole = await RoleModel.create({
        name: role
      });
      this.#roles.push(newRole);
    }
  }
}

module.exports = RoleService;
