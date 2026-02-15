import jwt from "jsonwebtoken";
import { AppConstants } from "@/server.constants";
import type { IConfigService } from "@/services/core/config.service";
import { SettingsStore } from "@/state/settings.store";
import type { IJwtService } from "@/services/interfaces/jwt.service.interface";

export class JwtService implements IJwtService {
  constructor(
    private readonly settingsStore: SettingsStore,
    private readonly configService: IConfigService,
  ) {}

  async signJwtToken(userId: number, username: string) {
    const { jwtSecret, jwtExpiresIn } = await this.settingsStore.getCredentialSettings();

    return jwt.sign({ userId, username }, jwtSecret, {
      expiresIn: jwtExpiresIn,
      subject: userId.toString(),
      audience: this.configService.get(AppConstants.OVERRIDE_JWT_AUDIENCE, AppConstants.DEFAULT_JWT_AUDIENCE),
      issuer: this.configService.get(AppConstants.OVERRIDE_JWT_ISSUER, AppConstants.DEFAULT_JWT_ISSUER),
    });
  }
}
