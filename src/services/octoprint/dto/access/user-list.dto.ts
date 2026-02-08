import type { UserDto } from "@/services/octoprint/dto/access/user.dto";

export interface UserListDto {
  users: UserDto[];
}
