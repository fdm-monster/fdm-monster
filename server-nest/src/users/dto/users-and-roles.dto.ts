import { UserRoleDto } from "@/users/dto/user-role.dto";
import { UserDto } from "@/users/dto/user.dto";

export class UsersAndRolesDto {
  users: UserDto[];
  roles: UserRoleDto[];
}
