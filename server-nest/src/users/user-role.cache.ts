import { CacheCrudManager } from "@/shared/cached-crud.manager";
import { UserRole } from "@/users/entities/user-role.entity";
import { UserRoleService } from "@/users/user-role.service";
import { UserRoleDto } from "@/users/dto/user-role.dto";
import { CreateUserRoleDto } from "@/users/dto/create-user-role.dto";

export class UserRoleCache extends CacheCrudManager<UserRole, undefined, CreateUserRoleDto, undefined, UserRoleDto>(
  "user-roles",
  UserRoleService,
  UserRole,
  UserRoleDto,
  0
) {
  service: UserRoleService;

  async getUserRoles(userId: number) {
    // TODO apply to cache
    return await this.service.getUserRoles(userId);
  }
}
