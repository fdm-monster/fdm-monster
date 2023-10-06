import { IdType } from "@/shared.constants";
import { IUser } from "@/models/Auth/User";
import { UserDto } from "@/services/interfaces/user.dto";

export interface IUserService<KeyType = IdType> {
  toDto(user: IUser): { createdAt: any; roles: any; name: any; id: any; username: any };

  listUsers(limit: number): Promise<any>;

  findRawByRoleId(roleId: KeyType): Promise<IUser>;

  getDemoUserId(): Promise<KeyType>;

  findRawByUsername(username: string): Promise<IUser>;

  getUser(userId: KeyType): Promise<any>;

  getUserRoles(userId: KeyType): Promise<any>;

  setUserRoleIds(userId: KeyType, roleIds: KeyType[]): Promise<any>;

  deleteUser(userId: KeyType): Promise<void>;

  updateUsernameById(userId: KeyType, newUsername: string): Promise<any>;

  updatePasswordById(userId: KeyType, oldPassword: string, newPassword: string): Promise<any>;

  updatePasswordUnsafe(username: string, newPassword: string): Promise<any>;

  register(input: Partial<UserDto>): Promise<IUser>;
}
