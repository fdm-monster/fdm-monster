import type { RoleName } from "@/constants/authorization.constants";

export class UserDto {
  id: number;
  createdAt: Date;
  username: string;
  isDemoUser: boolean;
  isRootUser: boolean;
  isVerified: boolean;
  needsPasswordChange: boolean;
  roles: RoleName[];
}

export class RegisterUserDto {
  username: string;
  password: string;
  roles: RoleName[];
  isDemoUser: boolean;
  isRootUser: boolean;
  isVerified: boolean;
  needsPasswordChange: boolean;
}
