import { BaseService } from "@/services/orm/base.service";
import { RegisterUserDto, UserDto } from "@/services/interfaces/user.dto";
import { User } from "@/entities";
import { SqliteIdType } from "@/shared.constants";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { DeleteResult, In } from "typeorm";
import { InternalServerException, NotFoundException } from "@/exceptions/runtime.exceptions";
import { validateInput } from "@/handlers/validators";
import { newPasswordRules, registerUserRules } from "@/services/validators/user-service.validation";
import { comparePasswordHash, hashPassword } from "@/utils/crypto.utils";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { UserRoleService } from "@/services/orm/user-role.service";
import { ROLES } from "@/constants/authorization.constants";
import { RoleService } from "@/services/orm/role.service";

export class UserService extends BaseService(User, UserDto<SqliteIdType>) implements IUserService<SqliteIdType, User> {
  constructor(
    typeormService: TypeormService,
    private readonly userRoleService: UserRoleService,
    private readonly roleService: RoleService
  ) {
    super(typeormService);
  }

  toDto(user: User): UserDto<SqliteIdType> {
    return {
      id: user.id,
      createdAt: user.createdAt,
      isVerified: user.isVerified,
      isDemoUser: user.isDemoUser,
      isRootUser: user.isRootUser,
      username: user.username,
      needsPasswordChange: user.needsPasswordChange,
      roles: user.roles?.map((r) => r.roleId),
    };
  }

  listUsers(limit?: number): Promise<User[]> {
    return this.list({ take: limit });
  }

  getUser(userId: SqliteIdType): Promise<User> {
    return this.get(userId, true);
  }

  async getUserRoleIds(userId: SqliteIdType): Promise<SqliteIdType[]> {
    const userRoles = await this.userRoleService.listUserRoles(userId);
    return userRoles.map((ur) => ur.roleId);
  }

  findRootUsers(): Promise<User[]> {
    return this.repository.findBy({ isRootUser: true });
  }

  async findUsersByRoleId(roleId: SqliteIdType): Promise<User[]> {
    const userRoles = await this.userRoleService.listByRoleId(roleId);
    const ids = userRoles.map((u) => u.id);
    return this.repository.findBy({ id: In(ids) });
  }

  findVerifiedUsers(): Promise<User[]> {
    return this.repository.findBy({ isVerified: true });
  }

  async isUserRootUser(userId: SqliteIdType): Promise<boolean> {
    const entity = await this.get(userId);
    return entity.isRootUser;
  }

  async deleteUser(userId: SqliteIdType): Promise<DeleteResult> {
    // Validate
    const user = await this.getUser(userId);

    if (user.isRootUser) {
      throw new InternalServerException("Cannot delete a root user");
    }

    // Check if the user is the last admin
    const role = this.roleService.getRoleByName(ROLES.ADMIN);
    if (user.roles.find((r) => r.roleId == role.id)) {
      const administrators = await this.findUsersByRoleId(role.id);
      if (administrators?.length === 1 && administrators[0].id === userId) {
        throw new InternalServerException("Cannot delete the last user with ADMIN role");
      }
    }

    return await this.delete(userId);
  }

  findRawByUsername(username: string): Promise<User> {
    return this.repository.findOneBy({ username });
  }

  async getDemoUserId(): Promise<SqliteIdType> {
    return (await this.repository.findOneBy({ isDemoUser: true }))?.id;
  }

  async setIsRootUserById(userId: SqliteIdType, isRootUser: boolean): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new NotFoundException("User not found");

    if (!isRootUser) {
      // Ensure at least one user is root user
      const rootUsers = await this.findRootUsers();
      if (rootUsers.length === 1 && rootUsers[0].id === userId) {
        throw new InternalServerException("Cannot set the last root user to non-root user");
      }
    }

    await this.update(userId, { isRootUser });
  }

  async setUserRoleIds(userId: SqliteIdType, roleIds: SqliteIdType[]): Promise<User> {
    await this.userRoleService.setUserRoles(userId, roleIds);
    return await this.get(userId, true);
  }

  async setVerifiedById(userId: SqliteIdType, isVerified: boolean): Promise<void> {
    const user = await this.getUser(userId);
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

    await this.update(userId, { isVerified });
  }

  async updatePasswordById(userId: SqliteIdType, oldPassword: string, newPassword: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new NotFoundException("User not found");

    if (!comparePasswordHash(oldPassword, user.passwordHash)) {
      throw new NotFoundException("User old password incorrect");
    }

    const { password } = await validateInput({ password: newPassword }, newPasswordRules);
    const passwordHash = hashPassword(password);
    return await this.update(userId, { passwordHash, needsPasswordChange: false });
  }

  async updatePasswordUnsafeByUsername(username: string, newPassword: string): Promise<User> {
    const { password } = await validateInput({ password: newPassword }, newPasswordRules);
    const passwordHash = hashPassword(password);
    const user = await this.findRawByUsername(username);
    if (!user) throw new NotFoundException("User not found");

    return await this.update(user.id, { passwordHash, needsPasswordChange: false });
  }

  updateUsernameById(userId: SqliteIdType, newUsername: string): Promise<User> {
    return this.update(userId, { username: newUsername });
  }

  async register(input: RegisterUserDto<SqliteIdType>): Promise<User> {
    const { username, password, roles, isDemoUser, isRootUser, needsPasswordChange, isVerified } = (await validateInput(
      input,
      registerUserRules(true)
    )) as RegisterUserDto<SqliteIdType>;

    const passwordHash = hashPassword(password);
    const result = await this.create({
      username,
      passwordHash,
      isVerified: isVerified ?? false,
      isDemoUser: isDemoUser ?? false,
      isRootUser: isRootUser ?? false,
      needsPasswordChange: needsPasswordChange ?? true,
    });
    await this.userRoleService.setUserRoles(result.id, roles);

    return this.get(result.id);
  }
}
