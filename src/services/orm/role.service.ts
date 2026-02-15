import { BaseService } from "@/services/orm/base.service";
import type { IRoleService } from "@/services/interfaces/role-service.interface";
import { Role } from "@/entities";
import { SettingsStore } from "@/state/settings.store";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { RoleDto } from "@/services/interfaces/role.dto";
import { union } from "lodash-es";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { ROLE_PERMS, ROLES, type PermissionName, type RoleName } from "@/constants/authorization.constants";

export class RoleService extends BaseService(Role, RoleDto) implements IRoleService {
  constructor(
    typeormService: TypeormService,
    private readonly appDefaultRole: RoleName,
    private readonly appDefaultRoleNoLogin: RoleName,
    private readonly settingsStore: SettingsStore,
  ) {
    super(typeormService);
  }

  private _roles: Role[] = [];

  get roles() {
    return this._roles;
  }

  async getAppDefaultRole(): Promise<RoleName> {
    if (await this.settingsStore.getLoginRequired()) {
      return this.appDefaultRole;
    }
    return this.appDefaultRoleNoLogin;
  }

  async getAppDefaultRoleNames(): Promise<RoleName[]> {
    if (!this._roles?.length) {
      await this.syncRoles();
    }

    return [await this.getAppDefaultRole()];
  }

  toDto(role: Role): RoleDto {
    return {
      id: role.id,
      name: role.name as RoleName,
    };
  }

  getRolesPermissions(roleNames: RoleName[]): PermissionName[] {
    let permissions: PermissionName[] = [];
    if (!roleNames?.length) return [];

    for (const roleName of roleNames) {
      const rolePermissions = this.getRolePermissions(roleName);
      permissions = union(permissions, rolePermissions);
    }

    return permissions;
  }

  /**
   * Checks if any of the required roles are in the assigned roles
   * @param requiredRoles list of role names that would grant access
   * @param assignedRoles user's assigned role names
   * @param subset if true, any match grants access (OR); if false, all must match (AND)
   */
  authorizeRoles(requiredRoles: RoleName[], assignedRoles: RoleName[], subset: boolean): boolean {
    if (!requiredRoles?.length) return true;

    let isAuthorized = !subset; // Start with false for OR, true for AND
    for (const requiredRole of requiredRoles) {
      const result = this.authorizeRole(requiredRole, assignedRoles);
      isAuthorized = subset ? isAuthorized || result : isAuthorized && result;
    }

    return isAuthorized;
  }

  authorizeRole(requiredRole: RoleName, assignedRoles: RoleName[]): boolean {
    return assignedRoles.includes(requiredRole);
  }

  getManyRoles(roleIds: number[]): Role[] {
    return roleIds.map((roleId) => this.getRole(roleId));
  }

  getRole(roleId: number): Role {
    const role = this._roles.find((r) => r.id === roleId);
    if (!role) throw new NotFoundException(`Role by provided id was not found`);

    return role;
  }

  getRoleByName(roleName: RoleName): Role {
    const role = this._roles.find((r) => r.name === roleName);
    if (!role) throw new NotFoundException(`Role by provided name was not found`);

    return role;
  }

  getRolePermissions(roleName: RoleName): PermissionName[] {
    if (!roleName) {
      return [];
    }
    return ROLE_PERMS[roleName] ?? [];
  }

  roleIdsToRoleNames(roleIds: number[]): RoleName[] {
    return roleIds
      .map((roleId) => {
        const role = this._roles.find((r) => r.id === roleId);
        return role?.name as RoleName | undefined;
      })
      .filter((name): name is RoleName => name !== undefined);
  }

  async getSynchronizedRoleByName(roleName: RoleName): Promise<Role> {
    if (!this._roles?.length) {
      await this.syncRoles();
    }

    return this.getRoleByName(roleName);
  }

  async syncRoles(): Promise<void> {
    this._roles = [];
    for (const roleName of Object.values(ROLES)) {
      const storedRole = await this.repository.findOneBy({ name: roleName });
      if (storedRole) {
        this._roles.push(storedRole);
      } else {
        const newRole = await this.create({
          name: roleName,
        });
        this._roles.push(newRole);
      }
    }
  }
}
