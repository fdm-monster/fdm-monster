import { AuthenticationError } from "@/exceptions/runtime.exceptions";
import { comparePasswordHash } from "@/utils/crypto.utils";
import { SettingsStore } from "@/state/settings.store";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { IJwtService } from "@/services/interfaces/jwt.service.interface";
import { MongoIdType } from "@/shared.constants";
import { IAuthService } from "@/services/interfaces/auth.service.interface";
import { IRefreshTokenService } from "@/services/interfaces/refresh-token.service.interface";
import { AUTH_ERROR_REASON } from "@/constants/authorization.constants";
import { captureException } from "@sentry/node";

export class AuthService implements IAuthService {
  private logger: LoggerService;
  private userService: IUserService;
  private jwtService: IJwtService;
  private settingsStore: SettingsStore;
  private refreshTokenService: IRefreshTokenService<MongoIdType>;
  /**
   *  When users are blacklisted at runtime, this cache can make quick work of rejecting them
   */
  private blacklistedJwtCache: Record<string, { userId: MongoIdType; createdAt: number }> = {};

  /**
   * loginUser: starts new session: id-token, refresh, removing any old refresh
   * logoutUser: ends session, removes refresh token and blacklists userId
   * renewLoginByRefreshToken: renews session, reduces refresh attempts
   * addBlackListEntry: private, adds a blacklisted entry after logout
   * removeBlacklistEntry: private, removes a blacklisted entry
   * logoutUser
   * signJwtToken: private, purely signs a new jwt token
   */

  /**
   * cool features: faking other user logins (encapsulated login? Double login?)
   * registration link
   * loginUser: username/password based login
   * blacklist: forcing all existing refresh tokens and jwts to be rejected of that user until login
   * refreshAttempts => integer in setting with cap?
   */

  constructor({
    userService,
    jwtService,
    loggerFactory,
    settingsStore,
    refreshTokenService,
  }: {
    userService: IUserService<MongoIdType>;
    jwtService: IJwtService<MongoIdType>;
    loggerFactory: ILoggerFactory;
    settingsStore: SettingsStore;
    refreshTokenService: IRefreshTokenService<MongoIdType>;
  }) {
    this.userService = userService;
    this.jwtService = jwtService;
    this.logger = loggerFactory(AuthService.name);
    this.settingsStore = settingsStore;
    this.refreshTokenService = refreshTokenService;
  }

  async loginUser(username: string, password: string) {
    const userDoc = await this.userService.findRawByUsername(username);
    if (!userDoc) {
      throw new AuthenticationError("Login incorrect", AUTH_ERROR_REASON.IncorrectCredentials);
    }
    const result = comparePasswordHash(password, userDoc.passwordHash);
    if (!result) {
      throw new AuthenticationError("Login incorrect", AUTH_ERROR_REASON.IncorrectCredentials);
    }

    const userId = userDoc.id.toString();
    const token = await this.signJwtToken(userId);
    await this.refreshTokenService.purgeOutdatedRefreshTokensByUserId(userId);
    await this.purgeOutdatedBlacklistedJwtCache();

    const refreshToken = await this.refreshTokenService.createRefreshTokenForUserId(userId);
    return {
      token,
      refreshToken,
    };
  }

  async logoutUserId(userId: MongoIdType, jwtToken?: string) {
    await this.refreshTokenService.deleteRefreshTokenByUserId(userId);
    if (jwtToken?.length) {
      this.blacklistedJwtCache[jwtToken] = { userId, createdAt: Date.now() };
      await this.purgeOutdatedBlacklistedJwtCache();
    }
  }

  async purgeOutdatedBlacklistedJwtCache() {
    try {
      const { jwtExpiresIn } = await this.settingsStore.getCredentialSettings();
      const now = Date.now();
      const keys = Object.keys(this.blacklistedJwtCache);
      for (const key of keys) {
        const { createdAt } = this.blacklistedJwtCache[key];
        if (now - createdAt > jwtExpiresIn) {
          delete this.blacklistedJwtCache[key];
        }
      }
    } catch (err) {
      this.logger.error("Failed to purge blacklisted jwt cache", err);
      captureException(err);
    }
  }

  async logoutUserRefreshToken(refreshToken: string) {
    const userRefreshToken = await this.getValidRefreshToken(refreshToken);
    await this.refreshTokenService.deleteRefreshTokenByUserId(userRefreshToken.userId.toString());
  }

  async renewLoginByRefreshToken(refreshToken: string): Promise<string> {
    const userRefreshToken = await this.getValidRefreshToken(refreshToken, false);
    if (!userRefreshToken) {
      throw new AuthenticationError(
        "The refresh token was invalid or expired, could not refresh user token",
        AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken
      );
    }

    const userId = userRefreshToken.userId.toString();
    const user = await this.userService.getUser(userId, false);
    if (!user) {
      await this.refreshTokenService.deleteRefreshToken(refreshToken);
      throw new AuthenticationError("User not found", AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken);
    }

    // If the user is not found at this point, then the user was deleted
    const token = await this.signJwtToken(userId);
    await this.increaseRefreshTokenAttemptsUsed(userRefreshToken.refreshToken);
    return token;
  }

  isJwtTokenBlacklisted(jwtToken: string) {
    return this.blacklistedJwtCache[jwtToken];
  }

  async getValidRefreshToken(refreshToken: string, throwNotFoundError: boolean = true) {
    const userRefreshToken = await this.refreshTokenService.getRefreshToken(refreshToken, throwNotFoundError);
    if (!userRefreshToken) {
      return null;
    }
    if (Date.now() > userRefreshToken.expiresAt) {
      await this.refreshTokenService.deleteRefreshTokenByUserId(userRefreshToken.userId.toString());
      throw new AuthenticationError("Refresh token expired, login required", AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken);
    }
    return userRefreshToken;
  }

  async increaseRefreshTokenAttemptsUsed(refreshToken: string): Promise<void> {
    const { refreshTokenAttempts } = await this.settingsStore.getCredentialSettings();
    const userRefreshToken = await this.getValidRefreshToken(refreshToken);
    const attemptsUsed = userRefreshToken.refreshAttemptsUsed;

    // If no attempts are set, then we don't care about attempts
    if (refreshTokenAttempts !== -1) {
      if (attemptsUsed >= refreshTokenAttempts) {
        await this.refreshTokenService.deleteRefreshTokenByUserId(userRefreshToken.userId.toString());
        throw new AuthenticationError(
          "Refresh token attempts exceeded, login required",
          AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken
        );
      }
    }

    await this.refreshTokenService.updateRefreshTokenAttempts(refreshToken, attemptsUsed + 1);
  }

  async signJwtToken(userId: MongoIdType) {
    const user = await this.userService.getUser(userId, false);
    if (!user) {
      throw new AuthenticationError("User not found", AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken);
    }
    if (user.needsPasswordChange) {
      throw new AuthenticationError("Password change required", AUTH_ERROR_REASON.PasswordChangeRequired);
    }
    if (!user.isVerified) {
      throw new AuthenticationError("User is not verified yet", AUTH_ERROR_REASON.AccountNotVerified);
    }
    return this.jwtService.signJwtToken(userId, user.username);
  }
}
