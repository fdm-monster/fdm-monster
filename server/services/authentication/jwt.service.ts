const { sign } = require("jsonwebtoken");
const { AppConstants } = require("../../server.constants");

export class JwtService {
  /**
   * @type {SettingsStore}
   */
  settingsStore;
  /**
   * @type {ConfigService}
   */
  configService;

  constructor({ settingsStore, configService }) {
    this.settingsStore = settingsStore;
    this.configService = configService;
  }

  async signJwtToken(userId, username) {
    const { jwtSecret, jwtExpiresIn } = await this.settingsStore.getCredentialSettings();

    return sign({ userId, username }, jwtSecret, {
      expiresIn: jwtExpiresIn,
      audience: this.configService.get(AppConstants.OVERRIDE_JWT_AUDIENCE, AppConstants.DEFAULT_JWT_AUDIENCE),
      issuer: this.configService.get(AppConstants.OVERRIDE_JWT_ISSUER, AppConstants.DEFAULT_JWT_ISSUER),
    });
  }
}

module.exports = {
  JwtService,
};
