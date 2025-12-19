import { User } from "@/models";
import { InternalServerException, NotFoundException } from "@/exceptions/runtime.exceptions";
import { validateInput } from "@/handlers/validators";
import { newPasswordSchema, registerUserSchema } from "../validators/user-service.validation";
import { ROLES } from "@/constants/authorization.constants";
import { comparePasswordHash, hashPassword } from "@/utils/crypto.utils";
import { RoleService } from "@/services/mongoose/role.service";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { MongoIdType } from "@/shared.constants";
import { RegisterUserDto, UserDto } from "@/services/interfaces/user.dto";
import { IUser } from "@/models/Auth/User";
import { AnyArray } from "mongoose";

export class UserService implements IUserService<MongoIdType> {
  constructor(private readonly roleService: RoleService) {
  }

  toDto(user: IUser): UserDto {
    return {
      id: user.id,
      createdAt: user.createdAt,
      isVerified: user.isVerified,
      isDemoUser: user.isDemoUser,
      isRootUser: user.isRootUser,
      username: user.username,
      needsPasswordChange: user.needsPasswordChange,
      roles: user.roles.map((r) => r.toString()),
    };
  }

  async listUsers(limit = 10) {
    return User.find().limit(limit);
  }

  async findUsersByRoleId(roleId: MongoIdType) {
    return User.find({ roles: { $in: [roleId] } });
  }

  async findVerifiedUsers() {
    return User.find({ isVerified: true });
  }

  async isUserRootUser(userId: MongoIdType) {
    const entity = await this.getUser(userId);
    return entity.isRootUser;
  }

  async findRootUsers() {
    return User.find({ isRootUser: true });
  }

  async getDemoUserId(): Promise<MongoIdType | undefined> {
    return (await User.findOne({ isDemoUser: true }))?.id;
  }

  async findRawByUsername(username: string) {
    return User.findOne({
      username,
    });
  }

  async getUser(userId: MongoIdType): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    return user;
  }

  async getUserRoleIds(userId: MongoIdType) {
    const user = await this.getUser(userId);
    return user.roles?.map((r) => r.toString());
  }

  async setUserRoleIds(userId: MongoIdType, roleIds: MongoIdType[]): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException("User not found");
    const roles = this.roleService.getManyRoles(roleIds);

    user.roles = roles.map((r) => r.id);
    user.roles = Array.from(new Set(user.roles as AnyArray<MongoIdType>));

    return await user.save();
  }

  async deleteUser(userId: MongoIdType) {
    const user = await this.getUser(userId);

    if (user.isRootUser) {
      throw new InternalServerException("Cannot delete a root user");
    }

    // Check if the user is the last admin
    const role = this.roleService.getRoleByName(ROLES.ADMIN);
    if ((user.roles as AnyArray<MongoIdType>).includes(role.id)) {
      const administrators = await this.findUsersByRoleId(role.id);
      if (administrators?.length === 1 && administrators[0].id === userId) {
        throw new InternalServerException("Cannot delete the last user with ADMIN role");
      }
    }

    await User.findByIdAndDelete(user.id);
  }

  async updateUsernameById(userId: MongoIdType, newUsername: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    user.username = newUsername;
    return await user.save();
  }

  async updatePasswordById(userId: MongoIdType, oldPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    if (!comparePasswordHash(oldPassword, user.passwordHash)) {
      throw new NotFoundException("User old password incorrect");
    }

    const { password } = await validateInput({ password: newPassword }, newPasswordSchema);
    user.passwordHash = hashPassword(password);
    user.needsPasswordChange = false;
    return await user.save();
  }

  async updatePasswordUnsafeByUsername(username: string, newPassword: string) {
    const { password } = await validateInput({ password: newPassword }, newPasswordSchema);
    const passwordHash = hashPassword(password);
    const user = await this.findRawByUsername(username);
    if (!user) throw new NotFoundException("User not found");

    user.passwordHash = passwordHash;
    user.needsPasswordChange = false;
    return await user.save();
  }

  async updatePasswordHashUnsafeByUsername(username: string, passwordHash: string) {
    const user = await this.findRawByUsername(username);
    if (!user) throw new NotFoundException("User not found");

    user.passwordHash = passwordHash;
    user.needsPasswordChange = false;
    return await user.save();
  }

  async setIsRootUserById(userId: MongoIdType, isRootUser: boolean) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    if (!isRootUser) {
      // Ensure at least one user is root user
      const rootUsers = await this.findRootUsers();
      if (rootUsers.length === 1 && rootUsers[0].id === userId) {
        throw new InternalServerException("Cannot set the last root user to non-root user");
      }
    }

    user.isRootUser = isRootUser;
    await user.save();
  }

  async setVerifiedById(userId: MongoIdType, isVerified: boolean) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    if (!isVerified) {
      if (user.isRootUser) {
        throw new InternalServerException("Cannot set a owner (root user) to unverified");
      }

      // Ensure at least one user is verified
      const verifiedUsers = await this.findVerifiedUsers();
      if (verifiedUsers.length === 1) {
        throw new InternalServerException("Cannot set the last user to unverified");
      }
    }

    user.isVerified = isVerified;
    await user.save();
  }

  async register(input: RegisterUserDto<MongoIdType>) {
    const { username, password, roles, isDemoUser, isRootUser, needsPasswordChange, isVerified } = await validateInput(
      input,
      registerUserSchema(false),
    );

    const passwordHash = hashPassword(password);
    return await User.create({
      username,
      passwordHash,
      roles,
      isVerified: isVerified ?? false,
      isDemoUser: isDemoUser ?? false,
      isRootUser: isRootUser ?? false,
      needsPasswordChange: needsPasswordChange ?? true,
    });
  }
}
