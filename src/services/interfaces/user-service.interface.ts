import { IdType } from "@/shared.constants";
import { IUser } from "@/models/Auth/User";
import { RegisterUserDto, UserDto } from "@/services/interfaces/user.dto";
import { DeleteResult } from "typeorm";

export interface IUserService<KeyType = IdType, Entity = IUser<KeyType>> {
  toDto(user: Entity): UserDto;

  listUsers(limit?: number): Promise<Entity[]>;

  findUsersByRoleId(roleId: KeyType): Promise<Entity[]>;

  findVerifiedUsers(): Promise<Entity[]>;

  isUserRootUser(userId: KeyType): Promise<boolean>;

  findRootUsers(): Promise<Entity[]>;

  getDemoUserId(): Promise<KeyType | undefined>;

  findRawByUsername(username: string): Promise<Entity | null>;

  getUser(userId: KeyType): Promise<Entity>;

  getUserRoleIds(userId: KeyType): Promise<KeyType[]>;

  setUserRoleIds(userId: KeyType, roleIds: KeyType[]): Promise<Entity>;

  deleteUser(userId: KeyType): Promise<DeleteResult | void>;

  updateUsernameById(userId: KeyType, newUsername: string): Promise<Entity>;

  updatePasswordById(userId: KeyType, oldPassword: string, newPassword: string): Promise<Entity>;

  updatePasswordUnsafeByUsername(username: string, newPassword: string): Promise<Entity>;

  updatePasswordHashUnsafeByUsername(username: string, passwordHash: string): Promise<Entity>;

  setIsRootUserById(userId: KeyType, isRootUser: boolean): Promise<void>;

  setVerifiedById(userId: KeyType, isVerified: boolean): Promise<void>;

  register(input: RegisterUserDto<KeyType>): Promise<Entity>;
}
