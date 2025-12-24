import { IdType } from "@/shared.constants";

import { RefreshTokenDto } from "@/services/interfaces/refresh-token.dto";
import { RefreshToken } from "@/entities";

export interface IRefreshTokenService<KeyType = IdType, Entity = RefreshToken> {
  toDto(entity: Entity): RefreshTokenDto<KeyType>;

  getRefreshToken(refreshToken: string): Promise<Entity>;

  createRefreshTokenForUserId(userId: KeyType): Promise<string>;

  updateRefreshTokenAttempts(refreshToken: string, refreshAttemptsUsed: number): Promise<void>;

  deleteRefreshTokenByUserId(userId: KeyType): Promise<void>;

  purgeOutdatedRefreshTokensByUserId(userId: KeyType): Promise<void>;

  purgeAllOutdatedRefreshTokens(): Promise<void>;

  deleteRefreshToken(refreshToken: string): Promise<void>;
}
