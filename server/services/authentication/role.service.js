const { ROLES } = require("../../constants/service.constants");
const RoleModel = require("../../models/Auth/Role");

class RoleService {
  async syncRoles() {
    for (let role of Object.values(ROLES)) {
      await RoleModel.create({
        name: role
      });
    }
  }
}

module.exports = RoleService;
