import { Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AuthConfig } from "./auth.config";
import { ConfigType } from "@nestjs/config";
import { LoginDto } from "@/auth/dto/login.dto";
import { UserService } from "@/users/user.service";
import { SettingsCache } from "@/settings/settings.cache";
import { comparePasswordHash } from "@/utils/crypto.utils";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AuthConfig.KEY) private jwtOptions: ConfigType<typeof AuthConfig>,
    private userService: UserService,
    private settingsCache: SettingsCache,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findOneByUsername(loginDto.username);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const settings = await this.settingsCache.getOrCreate();
    const requireLogin = settings.server.requireLogin;
    if (requireLogin) {
      const isCorrectPassword = comparePasswordHash(loginDto.password, user.passwordHash);
      if (!isCorrectPassword) {
        throw new UnauthorizedException("Invalid password");
      }
    }
    const payload = { sub: user.id, username: user.username };
    return {
      token: await this.jwtService.signAsync(payload),
    };
  }
}
