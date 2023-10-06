export class UserDto {
  id: string;
  username: string;
  isDemoUser: boolean;
  isRootUser: boolean;
  needsPasswordChange: boolean;
  roles: string[];
}
