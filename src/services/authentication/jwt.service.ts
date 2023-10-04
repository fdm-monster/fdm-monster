import { sign } from "jsonwebtoken";
import { AppConstants } from "@/server.constants";
import { ConfigService } from "@/services/core/config.service";
import { SettingsStore } from "@/state/settings.store";

export class JwtService {
  settingsStore: SettingsStore;
  configService: ConfigService;

  constructor({ settingsStore, configService }: { settingsStore: SettingsStore; configService: ConfigService }) {
    this.settingsStore = settingsStore;
    this.configService = configService;
  }

  async signJwtToken(userId: string, username: string) {
    const { jwtSecret, jwtExpiresIn } = await this.settingsStore.getCredentialSettings();

    return sign({ userId, username }, jwtSecret, {
      expiresIn: jwtExpiresIn,
      subject: userId,
      audience: this.configService.get(AppConstants.OVERRIDE_JWT_AUDIENCE, AppConstants.DEFAULT_JWT_AUDIENCE),
      issuer: this.configService.get(AppConstants.OVERRIDE_JWT_ISSUER, AppConstants.DEFAULT_JWT_ISSUER),
    });
  }
}
