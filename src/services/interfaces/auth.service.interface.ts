import { IdType } from "@/shared.constants";

export interface IAuthService<KeyType = IdType> {
  loginUser(username: string, password: string): Promise<{ token: string; refreshToken: string }>;

  logoutUserId(userId: KeyType): Promise<void>;

  logoutUserRefreshToken(refreshToken: string): Promise<void>;

  renewLoginByRefreshToken(refreshToken: string): Promise<string>;

  isBlacklisted(userId: KeyType): boolean;

  increaseRefreshTokenAttemptsUsed(refreshToken: string): Promise<void>;

  signJwtToken(userId: KeyType): Promise<string>;

  deleteRefreshTokenAndBlacklistUserId(userId: KeyType): Promise<void>;

  addBlackListEntry(userId: KeyType): void;

  removeBlacklistEntry(userId: KeyType): void;
}
