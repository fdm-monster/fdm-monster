import { BaseService } from "@/services/orm/base.service";
import { UserRole } from "@/entities/user-role.entity";
import { UserRoleDto } from "@/services/interfaces/user-role.dto";
import { In } from "typeorm";

export class UserRoleService extends BaseService(UserRole, UserRoleDto) {
  toDto(entity: UserRole): UserRoleDto {
    return {
      id: entity.id,
      roleId: entity.roleId,
      userId: entity.userId,
      createdAt: entity.createdAt,
    };
  }

  async setUserRoles(userId: number, roleIds: number[]) {
    const previousRoles = await this.listUserRoles(userId);
    const previousIds = previousRoles.map((p) => p.roleId);

    const deletedRoleIds = previousIds.filter((p) => !roleIds.includes(p));
    await this.deleteManyUserRoles(userId, deletedRoleIds);
    const createdRoleIds = roleIds.filter((r) => !previousIds.includes(r));
    for (let roleId of createdRoleIds) {
      await this.create({
        roleId,
        userId,
      });
    }
  }

  deleteManyUserRoles(userId: number, roleIds: number[]) {
    return this.repository.delete({
      userId,
      roleId: In(roleIds),
    });
  }

  listByRoleId(roleId: number) {
    return this.repository.findBy({ roleId });
  }

  async listUserRoles(userId: number) {
    return this.repository.findBy({ userId });
  }
}
