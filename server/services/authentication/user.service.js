const UserModel = require("../../models/Auth/User");
const {
  NotFoundException,
  InternalServerException
} = require("../../exceptions/runtime.exceptions");
const { validateInput } = require("../../handlers/validators");
const { registerUserRules } = require("../validators/user-service.validation");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../../constants/authorization.constants");

class UserService {
  #roleService;

  constructor({ roleService }) {
    this.#roleService = roleService;
  }

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

  async findByRoleId(roleId) {
    return UserModel.find({ roles: { $in: [roleId] } });
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

  async deleteUser(userId) {
    // Validate
    const user = await this.getUser(userId);
    const role = this.#roleService.getRoleByName(ROLES.ADMIN);

    if (user.roles.includes(role.id)) {
      const administrators = await this.findByRoleId(role.id);
      if (administrators?.length === 1) {
        throw new InternalServerException("Cannot delete the last user with ADMIN role.");
      }
    }

    await UserModel.findByIdAndDelete(user.id);
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
