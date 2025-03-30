import { sign } from "jsonwebtoken";
import { AppConstants } from "@/server.constants";
import { IConfigService } from "@/services/core/config.service";
import { SettingsStore } from "@/state/settings.store";
import { IdType } from "@/shared.constants";
import { IJwtService } from "@/services/interfaces/jwt.service.interface";

export class JwtService implements IJwtService {
  constructor(private readonly settingsStore: SettingsStore, private readonly configService: IConfigService) {}

  async signJwtToken(userId: IdType, username: string) {
    const { jwtSecret, jwtExpiresIn } = await this.settingsStore.getCredentialSettings();

    return sign({ userId, username }, jwtSecret, {
      expiresIn: jwtExpiresIn,
      subject: userId.toString(),
      audience: this.configService.get(AppConstants.OVERRIDE_JWT_AUDIENCE, AppConstants.DEFAULT_JWT_AUDIENCE),
      issuer: this.configService.get(AppConstants.OVERRIDE_JWT_ISSUER, AppConstants.DEFAULT_JWT_ISSUER),
    });
  }
}
