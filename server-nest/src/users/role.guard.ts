import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@/users/user.constants";
import { ROLES_KEY } from "@/shared/decorators/role.decorator";
import { UserRoleCache } from "@/users/user-role.cache";

@Injectable()
export class RolesGuard implements CanActivate {
  readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector, private userRoleCache: UserRoleCache) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      this.logger.warn("User request context not set - skipping rbac check");
      return true;
    }
    const roles = await this.userRoleCache.getUserRoles(user.sub);
    const missingRoles = requiredRoles.filter((role) => !roles.includes(role));
    const rolesString = missingRoles.join(", ");
    if (missingRoles.length) {
      this.logger.warn(`User roles '${user.roles}' is missing roles: "${rolesString}'`);
      return false;
    }
    return true;
  }
}
