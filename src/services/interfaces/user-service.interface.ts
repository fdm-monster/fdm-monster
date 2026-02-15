import type { RegisterUserDto, UserDto } from "@/services/interfaces/user.dto";
import { DeleteResult } from "typeorm";
import { User } from "@/entities";
import type { RoleName } from "@/constants/authorization.constants";

export interface IUserService<Entity = User> {
  toDto(user: Entity): UserDto;

  listUsers(limit?: number): Promise<Entity[]>;

  findVerifiedUsers(): Promise<Entity[]>;

  isUserRootUser(userId: number): Promise<boolean>;

  findRootUsers(): Promise<Entity[]>;

  getDemoUserId(): Promise<number | undefined>;

  findRawByUsername(username: string): Promise<Entity | null>;

  getUser(userId: number): Promise<Entity>;

  getUserRoles(userId: number): Promise<RoleName[]>;

  setUserRoles(userId: number, roles: RoleName[]): Promise<Entity>;

  deleteUser(userId: number): Promise<DeleteResult | void>;

  updateUsernameById(userId: number, newUsername: string): Promise<Entity>;

  updatePasswordById(userId: number, oldPassword: string, newPassword: string): Promise<Entity>;

  updatePasswordUnsafeByUsername(username: string, newPassword: string): Promise<Entity>;

  updatePasswordHashUnsafeByUsername(username: string, passwordHash: string): Promise<Entity>;

  setIsRootUserById(userId: number, isRootUser: boolean): Promise<void>;

  setVerifiedById(userId: number, isVerified: boolean): Promise<void>;

  register(input: RegisterUserDto): Promise<Entity>;
}
