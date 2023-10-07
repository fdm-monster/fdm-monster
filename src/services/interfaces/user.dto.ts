import { IdType } from "@/shared.constants";

export class UserDto<KeyType = IdType> {
  id: KeyType;
  createdAt: Date;
  username: string;
  isDemoUser: boolean;
  isRootUser: boolean;
  isVerified: boolean;
  needsPasswordChange: boolean;
  roles: KeyType[];
}

export class RegisterUserDto<KeyType = IdType> {
  username: string;
  password: string;
  roles: KeyType[];
  isDemoUser: boolean;
  isRootUser: boolean;
  isVerified: boolean;
  needsPasswordChange: boolean;
}
