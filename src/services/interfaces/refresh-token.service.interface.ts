import { IdType, MongoIdType } from "@/shared.constants";
import { IRefreshToken } from "@/models/Auth/RefreshToken";

export interface IRefreshTokenService<KeyType = IdType> {
  getRefreshToken(refreshToken: string, throwNotFoundError?: boolean): Promise<IRefreshToken | null>;

  createRefreshTokenForUserId(userId: KeyType): Promise<string>;

  updateRefreshTokenAttempts(refreshToken: string, refreshAttemptsUsed: number): Promise<void>;

  deleteRefreshTokenByUserId(userId: MongoIdType): Promise<void>;

  purgeOutdatedRefreshTokensByUserId(userId: MongoIdType): Promise<void>;

  purgeAllOutdatedRefreshTokens(): Promise<void>;

  deleteRefreshToken(refreshToken: string): Promise<void>;
}
