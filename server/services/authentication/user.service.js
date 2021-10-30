const UserModel = require("../../models/Auth/User");
const { NotFoundException } = require("../../exceptions/runtime.exceptions");
const { validateInput } = require("../../handlers/validators");
const { registerUserRules } = require("../validators/user-service.validation");
const bcrypt = require("bcryptjs");

class UserService {
  async getUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    return user;
  }

  async getUserRoles(userId) {}

  async register(input) {
    const { username, name, password, roles } = await validateInput(input, registerUserRules);

    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(password, salt);

    const model = await UserModel.create({
      username,
      passwordHash: hash,
      name,
      roles
    });

    return {
      username: model.username,
      name: model.name,
      roles: model.roles
    };
  }
}

module.exports = UserService;
