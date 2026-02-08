import type { RefreshTokenDto } from "@/services/interfaces/refresh-token.dto";
import { RefreshToken } from "@/entities";

export interface IRefreshTokenService<Entity = RefreshToken> {
  toDto(entity: Entity): RefreshTokenDto;

  getRefreshToken(refreshToken: string): Promise<Entity>;

  createRefreshTokenForUserId(userId: number): Promise<string>;

  updateRefreshTokenAttempts(refreshToken: string, refreshAttemptsUsed: number): Promise<void>;

  deleteRefreshTokenByUserId(userId: number): Promise<void>;

  purgeOutdatedRefreshTokensByUserId(userId: number): Promise<void>;

  purgeAllOutdatedRefreshTokens(): Promise<void>;

  deleteRefreshToken(refreshToken: string): Promise<void>;
}
