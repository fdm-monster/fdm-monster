import { union } from "lodash";
import { ROLE_PERMS, ROLES } from "@/constants/authorization.constants";
import { Role } from "@/models";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { LoggerService } from "@/handlers/logger";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class RoleService {
  private logger: LoggerService;
  settingsStore: SettingsStore;
  appDefaultRole: string;
  appDefaultRoleNoLogin: string;

  constructor({
    loggerFactory,
    appDefaultRole,
    appDefaultRoleNoLogin,
    settingsStore,
  }: {
    loggerFactory: ILoggerFactory;
    appDefaultRole: string;
    appDefaultRoleNoLogin: string;
    settingsStore: SettingsStore;
  }) {
    this.logger = loggerFactory(RoleService.name);
    this.settingsStore = settingsStore;
    this.appDefaultRole = appDefaultRole;
    this.appDefaultRoleNoLogin = appDefaultRoleNoLogin;
  }

  private _roles: any[] = [];

  get roles() {
    return this._roles;
  }

  async getAppDefaultRole() {
    if (await this.settingsStore.getLoginRequired()) {
      return this.appDefaultRole;
    }
    return this.appDefaultRoleNoLogin;
  }

  getRolesPermissions(roles: string[]) {
    let permissions: string[] = [];
    if (!roles?.length) return [];

    for (let role of roles) {
      const normalizedRole = this.#normalizeRole(role);
      const rolePermissions = this.getRolePermissions(normalizedRole);
      permissions = union(permissions, rolePermissions);
    }

    return permissions;
  }

  getRolePermissions(role: string) {
    const normalizedRole = this.#normalizeRole(role);
    return ROLE_PERMS[normalizedRole];
  }

  async getAppDefaultRolesId() {
    if (!this._roles?.length) {
      await this.syncRoles();
    }

    const guestRole = this.getRoleByName(await this.getAppDefaultRole());
    return [guestRole.id];
  }

  /**
   * @param roleName {string}
   * @return {Promise<*>}
   */
  async getSynchronizedRoleByName(roleName: string) {
    if (!this._roles?.length) {
      await this.syncRoles();
    }

    return this.getRoleByName(roleName);
  }

  authorizeRole(requiredRole: string, assignedRoles: string[]) {
    return !!assignedRoles.find((ar) => {
      const normalizedRole = this.#normalizeRole(ar);
      if (!normalizedRole) return false;
      return normalizedRole === requiredRole;
    });
  }

  authorizeRoles(requiredRoles: string[], assignedRoles: string[], subset = true) {
    let isAuthorized = false;

    if (!requiredRoles?.length) return true;
    requiredRoles.forEach((rr) => {
      const result = this.authorizeRole(rr, assignedRoles);
      isAuthorized = subset ? isAuthorized || result : isAuthorized && result;
    });

    return isAuthorized;
  }

  getRoleByName(roleName: string) {
    const role = this._roles.find((r) => r.name === roleName);
    if (!role) throw new NotFoundException(`Role by name ${roleName} not found`);

    return role;
  }

  getManyRoles(roleIds: string[]): any[] {
    return roleIds.map((roleId) => this.getRole(roleId));
  }

  getRole(roleId: string) {
    const role = this._roles.find((r) => r.id === roleId);
    if (!role) throw new NotFoundException(`Role Id '${roleId}' not found`);

    return role;
  }

  async syncRoles() {
    this._roles = [];
    for (let roleName of Object.values(ROLES)) {
      const storedRole = await Role.findOne({ name: roleName });
      if (!storedRole) {
        const newRole = await Role.create({
          name: roleName,
        });
        this._roles.push(newRole);
      } else {
        this._roles.push(storedRole);
      }
    }
  }

  #normalizeRole(assignedRole: string) {
    const roleInstance = this.roles.find((r) => r.id === assignedRole || r.name === assignedRole);

    if (!roleInstance) {
      console.warn(`The role by ID '${assignedRole}' did not exist in definition. Skipping.`);
      return;
    }

    return roleInstance.name;
  }
}
