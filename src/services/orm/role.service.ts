import { BaseService } from "@/services/orm/base.service";
import { SqliteIdType } from "@/shared.constants";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { Role } from "@/entities";
import { LoggerService } from "@/handlers/logger";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { RoleDto } from "@/services/interfaces/role.dto";
import { union } from "lodash";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { ROLE_PERMS, ROLES } from "@/constants/authorization.constants";

export class RoleService extends BaseService(Role, RoleDto<SqliteIdType>) implements IRoleService<SqliteIdType, Role> {
  settingsStore: SettingsStore;
  appDefaultRole!: string;
  appDefaultRoleNoLogin: string;
  private logger: LoggerService;

  constructor({
    loggerFactory,
    appDefaultRole,
    appDefaultRoleNoLogin,
    settingsStore,
    typeormService,
  }: {
    loggerFactory: ILoggerFactory;
    appDefaultRole: string;
    appDefaultRoleNoLogin: string;
    settingsStore: SettingsStore;
    typeormService: TypeormService;
  }) {
    super({ typeormService });
    this.logger = loggerFactory(RoleService.name);
    this.settingsStore = settingsStore;
    this.appDefaultRole = appDefaultRole;
    this.appDefaultRoleNoLogin = appDefaultRoleNoLogin;
  }

  private _roles: Role[] = [];

  get roles() {
    return this._roles;
  }

  async getAppDefaultRole(): Promise<string> {
    if (await this.settingsStore.getLoginRequired()) {
      return this.appDefaultRole;
    }
    return this.appDefaultRoleNoLogin;
  }

  async getAppDefaultRoleIds(): Promise<number[]> {
    if (!this._roles?.length) {
      await this.syncRoles();
    }

    const guestRole = this.getRoleByName(await this.getAppDefaultRole());
    return [guestRole.id] as number[];
  }

  toDto(role: Role): RoleDto<SqliteIdType> {
    return {
      id: role.id,
      name: role.name,
    };
  }

  getRolesPermissions(roles: (string | SqliteIdType)[]): string[] {
    let permissions: string[] = [];
    if (!roles?.length) return [];

    for (let role of roles) {
      const normalizedRole = this.normalizeRoleIdOrName(role);
      const rolePermissions = this.getRolePermissions(normalizedRole);
      permissions = union(permissions, rolePermissions);
    }

    return permissions;
  }

  /**
   * Checks if the role names or ids overlap
   * @param requiredRoles list of roles that would grant access
   * @param assignedRoles application role names or role ids (not to be confused with user role assignments)
   * @param subset
   */
  authorizeRoles(requiredRoles: (string | SqliteIdType)[], assignedRoles: (string | SqliteIdType)[], subset: boolean): boolean {
    let isAuthorized = false;

    if (!requiredRoles?.length) return true;
    requiredRoles.forEach((rr) => {
      const result = this.authorizeRole(rr, assignedRoles);
      isAuthorized = subset ? isAuthorized || result : isAuthorized && result;
    });

    return isAuthorized;
  }

  authorizeRole(requiredRole: string | SqliteIdType, assignedRoles: (string | SqliteIdType)[]): boolean {
    return !!assignedRoles.find((ar) => {
      const normalizedRole = this.normalizeRoleIdOrName(ar);
      if (!normalizedRole) return false;
      return normalizedRole === requiredRole;
    });
  }

  getManyRoles(roleIds: SqliteIdType[]): Role[] {
    return roleIds.map((roleId) => this.getRole(roleId));
  }

  getRole(roleId: SqliteIdType): Role {
    const role = this._roles.find((r) => r.id === roleId);
    if (!role) throw new NotFoundException(`Role by provided id was not found`);

    return role;
  }

  getRoleByName(roleName: string): Role {
    const role = this._roles.find((r) => r.name === roleName);
    if (!role) throw new NotFoundException(`Role by provided name was not found`);

    return role;
  }

  getRolePermissions(role: string | SqliteIdType): string[] {
    const normalizedRole = this.normalizeRoleIdOrName(role);
    return ROLE_PERMS[normalizedRole];
  }

  async getSynchronizedRoleByName(roleName: string): Promise<Role> {
    if (!this._roles?.length) {
      await this.syncRoles();
    }

    return this.getRoleByName(roleName);
  }

  async syncRoles(): Promise<void> {
    this._roles = [];
    for (let roleName of Object.values(ROLES)) {
      const storedRole = await this.repository.findOneBy({ name: roleName });
      if (!storedRole) {
        const newRole = await this.create({
          name: roleName,
        });
        this._roles.push(newRole);
      } else {
        this._roles.push(storedRole);
      }
    }
  }

  private normalizeRoleIdOrName(assignedRole: string | SqliteIdType): string | undefined {
    const roleInstance = this.roles.find((r) => r.id === assignedRole || r.name === assignedRole);
    if (!roleInstance) {
      console.warn(`The role by provided id was not found. Skipping.`);
      return;
    }

    return roleInstance.name;
  }
}
