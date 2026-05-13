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
  /** True when the principal was authenticated via an API key, not a user login. */
  isApiKey?: boolean;
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
