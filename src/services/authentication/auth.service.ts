import { AuthenticationError } from "@/exceptions/runtime.exceptions";
import { comparePasswordHash } from "@/utils/crypto.utils";
import { SettingsStore } from "@/state/settings.store";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { IJwtService } from "@/services/interfaces/jwt.service.interface";
import { IAuthService } from "@/services/interfaces/auth.service.interface";
import { IRefreshTokenService } from "@/services/interfaces/refresh-token.service.interface";
import { AUTH_ERROR_REASON } from "@/constants/authorization.constants";
import { captureException } from "@sentry/node";
import { User } from "@/entities";

export class AuthService implements IAuthService {
  private readonly logger: LoggerService;
  /**
   *  When users are blacklisted at runtime, this cache can make quick work of rejecting them
   */
  private blacklistedJwtCache: Record<string, { userId: number; createdAt: number }> = {};

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly userService: IUserService<User>,
    private readonly jwtService: IJwtService,
    private readonly settingsStore: SettingsStore,
    private readonly refreshTokenService: IRefreshTokenService,
  ) {
    this.logger = loggerFactory(AuthService.name);
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

    const userId = userDoc.id;
    const token = await this.signJwtToken(userId);
    await this.refreshTokenService.purgeOutdatedRefreshTokensByUserId(userId);
    await this.purgeOutdatedBlacklistedJwtCache();

    const refreshToken = await this.refreshTokenService.createRefreshTokenForUserId(userId);
    return {
      token,
      refreshToken,
    };
  }

  async logoutUserId(userId: number, jwtToken?: string) {
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
    await this.refreshTokenService.deleteRefreshTokenByUserId(userRefreshToken.userId);
  }

  async renewLoginByRefreshToken(refreshToken: string): Promise<string> {
    const userRefreshToken = await this.getValidRefreshToken(refreshToken);

    const userId = userRefreshToken.userId;
    const user = await this.userService.getUser(userId);
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

  async getValidRefreshToken(refreshToken: string) {
    const userRefreshToken = await this.refreshTokenService.getRefreshToken(refreshToken);
    if (Date.now() > userRefreshToken.expiresAt) {
      await this.refreshTokenService.deleteRefreshTokenByUserId(userRefreshToken.userId);
      throw new AuthenticationError(
        "Refresh token expired, login required",
        AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken,
      );
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
        await this.refreshTokenService.deleteRefreshTokenByUserId(userRefreshToken.userId);
        throw new AuthenticationError(
          "Refresh token attempts exceeded, login required",
          AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken,
        );
      }
    }

    await this.refreshTokenService.updateRefreshTokenAttempts(refreshToken, attemptsUsed + 1);
  }

  async signJwtToken(userId: number) {
    const user = await this.userService.getUser(userId);
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
