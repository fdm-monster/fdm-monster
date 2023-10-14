import { IdType } from "@/shared.constants";
import { IRefreshToken } from "@/models/Auth/RefreshToken";

export interface IRefreshTokenService<KeyType = IdType, Entity = IRefreshToken> {
  getRefreshToken(refreshToken: string, throwNotFoundError?: boolean): Promise<Entity | null>;

  createRefreshTokenForUserId(userId: KeyType): Promise<string>;

  updateRefreshTokenAttempts(refreshToken: string, refreshAttemptsUsed: number): Promise<void>;

  deleteRefreshTokenByUserId(userId: KeyType): Promise<void>;

  purgeOutdatedRefreshTokensByUserId(userId: KeyType): Promise<void>;

  purgeAllOutdatedRefreshTokens(): Promise<void>;

  deleteRefreshToken(refreshToken: string): Promise<void>;
}
