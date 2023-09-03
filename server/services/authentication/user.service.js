const UserModel = require("../../models/Auth/User");
const { NotFoundException, InternalServerException } = require("../../exceptions/runtime.exceptions");
const { validateInput } = require("../../handlers/validators");
const { registerUserRules } = require("../validators/user-service.validation");
const { ROLES } = require("../../constants/authorization.constants");
const { hashPassword, comparePasswordHash } = require("../../utils/crypto.utils");

class UserService {
  /**
   * @type {RoleService}
   */
  roleService;

  constructor({ roleService }) {
    this.roleService = roleService;
  }

  /**
   * @private
   * @param user
   * @returns {{createdAt, roles, name, id, username}}
   */
  toDto(user) {
    return {
      id: user.id,
      createdAt: user.createdAt,
      username: user.username,
      name: user.name,
      roles: user.roles,
    };
  }

  async listUsers(limit = 10) {
    const userDocs = await UserModel.find().limit(limit);
    return userDocs.map((u) => this.toDto(u));
  }

  async findRawByRoleId(roleId) {
    return UserModel.find({ roles: { $in: [roleId] } });
  }

  async findRawByUsername(username) {
    return UserModel.findOne({
      username,
    });
  }

  async getUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    return this.toDto(user);
  }

  async getUserRoles(userId) {
    const user = await this.getUser(userId);
    return user.roles;
  }

  async deleteUser(userId) {
    // Validate
    const user = await this.getUser(userId);
    const role = this.roleService.getRoleByName(ROLES.ADMIN);

    if (user.roles.includes(role.id)) {
      const administrators = await this.findRawByRoleId(role.id);
      if (administrators?.length === 1) {
        throw new InternalServerException("Cannot delete the last user with ADMIN role.");
      }
    }

    await UserModel.findByIdAndDelete(user.id);
  }

  async updateUsernameById(userId, newUsername) {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    user.username = newUsername;
    return await user.save();
  }

  async updatePasswordById(userId, oldPassword, newPassword) {
    const newPasswordHash = hashPassword(newPassword);
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    if (!comparePasswordHash(oldPassword, user.passwordHash)) {
      throw new NotFoundException("User old password incorrect");
    }

    user.passwordHash = newPasswordHash;
    user.needsPasswordChange = false;
    return await user.save();
  }

  async updatePasswordUnsafe(username, newPassword) {
    const passwordHash = hashPassword(newPassword);
    const user = await this.findRawByUsername(username);
    if (!user) throw new NotFoundException("User not found");

    user.passwordHash = passwordHash;
    user.needsPasswordChange = false;
    return await user.save();
  }

  async register(input) {
    const { username, password, roles } = await validateInput(input, registerUserRules);

    const passwordHash = hashPassword(password);
    const userDoc = await UserModel.create({
      username,
      passwordHash,
      roles,
      needsPasswordChange: true,
    });

    return this.toDto(userDoc);
  }
}

module.exports = UserService;
