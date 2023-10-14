import { BaseService } from "@/services/orm/base.service";
import { SqliteIdType } from "@/shared.constants";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { Role } from "@/entities";
import { LoggerService } from "@/handlers/logger";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { RoleDto } from "@/services/interfaces/role.dto";
import { Promise } from "mongoose";

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

  authorizeRole(requiredRole: string, assignedRoles: string[]): boolean {
    return false;
  }

  authorizeRoles(requiredRoles: string[], assignedRoles: string[], subset: boolean): boolean {
    return false;
  }

  getAppDefaultRole(): Promise<string> {
    return Promise.resolve("");
  }

  getAppDefaultRoleIds(): Promise<any[]> {
    return Promise.resolve([]);
  }

  getManyRoles(roleIds: SqliteIdType[]): Role[] {
    return [];
  }

  getRole(roleId: SqliteIdType): Role {
    return undefined;
  }

  getRoleByName(roleName: string): Role {
    return undefined;
  }

  getRolePermissions(role: string): string[] {
    return [];
  }

  getRolesPermissions(roles: string[]): string[] {
    return [];
  }

  getSynchronizedRoleByName(roleName: string): Promise<Role> {
    return Promise.resolve(undefined);
  }

  normalizeRoleIdOrName(assignedRole: string | SqliteIdType): string | undefined {
    return undefined;
  }

  syncRoles(): Promise<void> {
    return Promise.resolve(undefined);
  }

  toDto(entity: T): DTO;
  toDto(entity: T): DTO;
  toDto(entity: T): DTO {
    return undefined;
  }
}
