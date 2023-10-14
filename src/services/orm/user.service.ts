import { BaseService } from "@/services/orm/base.service";
import { RegisterUserDto, UserDto } from "@/services/interfaces/user.dto";
import { User } from "@/entities";
import { MongoIdType, SqliteIdType } from "@/shared.constants";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { DeleteResult } from "typeorm";
import { NotImplementedException } from "@/exceptions/runtime.exceptions";

export class UserService extends BaseService(User, UserDto) implements IUserService<SqliteIdType, User> {
  toDto(user: User): UserDto {
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

  listUsers(limit?: number): Promise<User[]> {
    return this.list({ take: limit });
  }

  getUser(userId: SqliteIdType): Promise<User> {
    return this.get(userId, true);
  }

  async getUserRoles(userId: SqliteIdType): Promise<string[]> {
    return (await this.getUser(userId)).roles;
  }

  deleteUser(userId: SqliteIdType): Promise<DeleteResult> {
    return this.delete(userId);
  }

  findRawByUsername(username: string): Promise<User> {
    return this.repository.findOneBy({ username });
  }

  findUserByRoleId(roleId: SqliteIdType): Promise<User[]> {
    throw new NotImplementedException();
  }

  async getDemoUserId(): Promise<SqliteIdType> {
    return (await this.repository.findOneBy({ isDemoUser: true }))?.id;
  }

  register(input: RegisterUserDto<SqliteIdType>): Promise<User> {
    return Promise.resolve(undefined);
  }

  setIsRootUserById(userId: MongoIdType, isRootUser: boolean): Promise<void> {
    return Promise.resolve(undefined);
  }

  async setUserRoleIds(userId: SqliteIdType, roleIds: SqliteIdType[]): Promise<User> {
    const user = await this.getUser(userId);
    return Promise.resolve(undefined);
  }

  setVerifiedById(userId: MongoIdType, isVerified: boolean): Promise<void> {
    return Promise.resolve(undefined);
  }

  updatePasswordById(userId: SqliteIdType, oldPassword: string, newPassword: string): Promise<User> {
    return Promise.resolve(undefined);
  }

  updatePasswordUnsafe(username: string, newPassword: string): Promise<User> {
    return Promise.resolve(undefined);
  }

  updateUsernameById(userId: SqliteIdType, newUsername: string): Promise<User> {
    return Promise.resolve(undefined);
  }
}
