import { BaseService } from "@/services/orm/base.service";
import { RefreshToken } from "@/entities";
import { IRefreshTokenService } from "@/services/interfaces/refresh-token.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { RefreshTokenDto } from "@/services/interfaces/refresh-token.dto";
import { AuthenticationError } from "@/exceptions/runtime.exceptions";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { v4 as uuidv4 } from "uuid";
import { AppConstants } from "@/server.constants";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { LessThan } from "typeorm";
import { AUTH_ERROR_REASON } from "@/constants/authorization.constants";

export class RefreshTokenService
  extends BaseService(RefreshToken, RefreshTokenDto<SqliteIdType>)
  implements IRefreshTokenService<SqliteIdType, RefreshToken>
{
  private logger: LoggerService;

  constructor(
    private readonly settingsStore: SettingsStore,
    loggerFactory: ILoggerFactory,
    typeormService: TypeormService,
  ) {
    super(typeormService);
    this.logger = loggerFactory(RefreshTokenService.name);
  }

  toDto(entity: RefreshToken): RefreshTokenDto<SqliteIdType> {
    return {
      id: entity.id,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      // Sensitive data
      // refreshToken: entity.refreshToken,
      refreshAttemptsUsed: entity.refreshAttemptsUsed,
    };
  }

  async getRefreshToken(refreshToken: string, throwNotFoundError = true): Promise<RefreshToken | null> {
    const entity = await this.repository.findOneBy({ refreshToken });
    if (!entity) {
      if (throwNotFoundError) {
        throw new AuthenticationError(
          `The entity ${RefreshToken.name} by provided refresh token is not found`,
          AUTH_ERROR_REASON.InvalidOrExpiredRefreshToken,
        );
      }
      return null;
    }

    return entity;
  }

  async createRefreshTokenForUserId(userId: SqliteIdType): Promise<string> {
    const { refreshTokenExpiry } = await this.settingsStore.getCredentialSettings();
    const refreshToken = uuidv4();

    const timespan = refreshTokenExpiry ?? AppConstants.DEFAULT_REFRESH_TOKEN_EXPIRY;
    if (!refreshTokenExpiry) {
      this.logger.warn("Refresh token expiry not set in Settings:credentials, using default value");
    }

    await this.create({
      userId,
      expiresAt: Date.now() + timespan * 1000,
      refreshToken,
      refreshAttemptsUsed: 0,
    });

    return refreshToken;
  }

  async updateRefreshTokenAttempts(refreshToken: string, refreshAttemptsUsed: number): Promise<void> {
    await this.getRefreshToken(refreshToken, true);

    await this.repository.update({ refreshToken }, { refreshAttemptsUsed });
  }

  async purgeAllOutdatedRefreshTokens(): Promise<void> {
    const result = await this.repository.delete({
      expiresAt: LessThan(Date.now()),
    });

    if (result.affected) {
      this.logger.debug(`Removed ${result.affected} outdated refresh tokens`);
    }
  }

  async deleteRefreshTokenByUserId(userId: SqliteIdType): Promise<void> {
    const result = await this.repository.delete({
      userId,
    });

    if (result.affected) {
      this.logger.debug(`Removed ${result.affected} login refresh tokens for user`);
    }
  }

  async deleteRefreshToken(refreshToken: string): Promise<void> {
    const result = await this.repository.delete({
      refreshToken,
    });

    if (result.affected) {
      this.logger.debug(`Removed ${result.affected} login refresh tokens`);
    }
  }

  async purgeOutdatedRefreshTokensByUserId(userId: SqliteIdType): Promise<void> {
    const result = await this.repository.delete({
      userId,
      expiresAt: LessThan(Date.now()),
    });

    if (result.affected) {
      this.logger.debug(`Removed ${result.affected} outdated login refresh tokens for user`);
    }
  }
}
