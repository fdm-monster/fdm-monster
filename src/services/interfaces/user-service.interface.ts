import { IdType, MongoIdType } from "@/shared.constants";
import { IUser } from "@/models/Auth/User";
import { UserDto } from "@/services/interfaces/user.dto";

export interface IUserService<KeyType = IdType> {
  toDto(user: IUser): UserDto;

  listUsers(limit?: number): Promise<IUser[]>;

  findUserByRoleId(roleId: KeyType): Promise<IUser[]>;

  getDemoUserId(): Promise<KeyType>;

  findRawByUsername(username: string): Promise<IUser>;

  getUser(userId: KeyType): Promise<IUser>;

  getUserRoles(userId: KeyType): Promise<string[]>;

  setUserRoleIds(userId: KeyType, roleIds: KeyType[]): Promise<IUser>;

  deleteUser(userId: KeyType): Promise<void>;

  updateUsernameById(userId: KeyType, newUsername: string): Promise<IUser>;

  updatePasswordById(userId: KeyType, oldPassword: string, newPassword: string): Promise<IUser>;

  updatePasswordUnsafe(username: string, newPassword: string): Promise<IUser>;

  setVerifiedById(userId: MongoIdType, isVerified: boolean): Promise<void>;

  register(input: Partial<UserDto>): Promise<IUser>;
}
