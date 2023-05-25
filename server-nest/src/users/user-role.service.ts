import { Injectable } from "@nestjs/common";
import { UserRole } from "@/users/entities/user-role.entity";
import { CrudService } from "@/shared/crud.service";
import { CreateUserRoleDto } from "@/users/dto/create-user-role.dto";
import { Role } from "@/users/user.constants";

@Injectable()
export class UserRoleService extends CrudService<UserRole, undefined, CreateUserRoleDto, undefined>(UserRole) {
  async getUserRoles(userId: number) {
    return this.repository
      .find({
        where: {
          userId,
        },
      })
      .then((rs) => rs.map((r) => r.role));
  }

  async findByRole(role: Role) {
    return this.repository.find({
      where: {
        role,
      },
    });
  }
}
