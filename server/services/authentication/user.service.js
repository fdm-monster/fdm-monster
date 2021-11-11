const UserModel = require("../../models/Auth/User");
const { NotFoundException } = require("../../exceptions/runtime.exceptions");
const { validateInput } = require("../../handlers/validators");
const { registerUserRules } = require("../validators/user-service.validation");
const bcrypt = require("bcryptjs");

class UserService {
  #toDto(user) {
    return {
      id: user.id,
      createdAt: user.createdAt,
      username: user.username,
      name: user.name,
      roles: user.roles
    };
  }

  async listUsers(limit = 10) {
    const userDocs = await UserModel.find().limit(limit);

    return userDocs.map((u) => this.#toDto(u));
  }

  async getUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    return this.#toDto(user);
  }

  async getUserRoles(userId) {
    const user = await this.getUser(userId);
    return user.roles;
  }

  async register(input) {
    const { username, name, password, roles } = await validateInput(input, registerUserRules);

    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(password, salt);

    const userDoc = await UserModel.create({
      username,
      passwordHash: hash,
      name,
      roles
    });

    return this.#toDto(userDoc);
  }
}

module.exports = UserService;
