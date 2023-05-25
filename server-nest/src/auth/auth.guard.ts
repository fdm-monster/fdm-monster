import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { SettingsCache } from "@/settings/settings.cache";
import { ConfigService } from "@nestjs/config";
import { defaultAdminUserName, jwtSecretToken } from "@/app.constants";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "@/shared/decorators/public.decorator";
import { UserService } from "@/users/user.service";

@Injectable()
export class AuthGuard implements CanActivate {
  logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private settingsCache: SettingsCache,
    private userService: UserService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const requireLogin = (await this.settingsCache.getOrCreate()).server.requireLogin;
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    let payload;
    try {
      if (!token && requireLogin) {
        throw new UnauthorizedException();
      } else if (!token && !requireLogin) {
        payload = {
          sub: await this.userService.getAdminUserId(),
          username: defaultAdminUserName,
        };
      } else if (!requireLogin) {
        payload = this.jwtService.decode(token);
      } else {
        const secret = this.configService.get(jwtSecretToken);
        payload = await this.jwtService.verifyAsync(token, {
          secret,
        });
      }
    } catch {
      throw new UnauthorizedException();
    }

    // 💡 We're assigning the payload to the request object here
    // so that we can access it in our route handlers
    this.logger.log(`User ${payload.username} authenticated`);
    request["user"] = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
