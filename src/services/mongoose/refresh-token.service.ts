import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { RefreshToken } from "@/models";
import { v4 as uuidv4 } from "uuid";
import { AppConstants } from "@/server.constants";
import { SettingsStore } from "@/state/settings.store";
import { MongoIdType } from "@/shared.constants";
import { IRefreshToken } from "@/models/Auth/RefreshToken";
import { AuthenticationError } from "@/exceptions/runtime.exceptions";
import { IRefreshTokenService } from "@/services/interfaces/refresh-token.service.interface";
import { AUTH_ERROR_REASON } from "@/constants/authorization.constants";
import { RefreshTokenDto } from "@/services/interfaces/refresh-token.dto";

export class RefreshTokenService implements IRefreshTokenService<MongoIdType> {
  private logger: LoggerService;

  constructor(loggerFactory: ILoggerFactory, private readonly settingsStore: SettingsStore) {
    this.logger = loggerFactory(RefreshTokenService.name);
  }

  toDto(entity: IRefreshToken): RefreshTokenDto<MongoIdType> {
    return {
      id: entity.id,
      userId: entity.userId.toString(),
      expiresAt: entity.expiresAt,
      // Sensitive data
      // refreshToken: entity.refreshToken,
      refreshAttemptsUsed: entity.refreshAttemptsUsed,
    };
  }

  async getRefreshToken(refreshToken: string, throwNotFoundError = true): Promise<IRefreshToken | null> {
    const userRefreshToken = await RefreshToken.findOne({
      refreshToken,
    });
    if (!userRefreshToken) {
      if (throwNotFoundError) {
        throw new AuthenticationError("The refresh token was not found", AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken);
      }
      return null;
    }
    return userRefreshToken;
  }

  async createRefreshTokenForUserId(userId: MongoIdType): Promise<string> {
    const { refreshTokenExpiry } = await this.settingsStore.getCredentialSettings();
    const refreshToken = uuidv4();

    const timespan = refreshTokenExpiry ?? AppConstants.DEFAULT_REFRESH_TOKEN_EXPIRY;
    if (!refreshTokenExpiry) {
      this.logger.warn(`Refresh token expiry not set in Settings:credentials, using default ${timespan} seconds}`);
    }

    await RefreshToken.create({
      userId,
      expiresAt: Date.now() + timespan * 1000,
      refreshToken,
      refreshAttemptsUsed: 0,
    });

    return refreshToken;
  }

  async updateRefreshTokenAttempts(refreshToken: string, refreshAttemptsUsed: number) {
    await this.getRefreshToken(refreshToken, true);

    await RefreshToken.updateOne(
      {
        refreshToken,
      },
      {
        refreshAttemptsUsed,
      },
      {
        new: true,
      }
    );
  }

  async purgeOutdatedRefreshTokensByUserId(userId: MongoIdType) {
    const result = await RefreshToken.deleteMany({
      userId,
      expiresAt: {
        $lt: Date.now(),
      },
    });

    if (result.deletedCount) {
      this.logger.debug(`Removed ${result.deletedCount} outdated login refresh tokens for user ${userId}`);
    }
  }

  async purgeAllOutdatedRefreshTokens() {
    const result = await RefreshToken.deleteMany({
      expiresAt: {
        $lt: Date.now(),
      },
    });

    if (result.deletedCount) {
      this.logger.debug(`Removed ${result.deletedCount} outdated login refresh tokens`);
    }
  }

  async deleteRefreshTokenByUserId(userId: MongoIdType): Promise<void> {
    const result = await RefreshToken.deleteMany({
      userId,
    });

    if (result.deletedCount) {
      this.logger.debug(`Removed ${result.deletedCount} login refresh tokens`);
    }
  }

  async deleteRefreshToken(refreshToken: string): Promise<void> {
    const result = await RefreshToken.deleteOne({
      refreshToken,
    });

    // TODO audit result
    if (result.deletedCount) {
      this.logger.debug(`Removed ${result.deletedCount} login refresh tokens`);
    }
  }
}
