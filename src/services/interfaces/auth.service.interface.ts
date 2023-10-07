import { IdType } from "@/shared.constants";

export interface IAuthService<KeyType = IdType> {
  loginUser(username: string, password: string): Promise<{ token: string; refreshToken: string }>;

  logoutUserId(userId: KeyType, jwtToken?: string): Promise<void>;

  logoutUserRefreshToken(refreshToken: string): Promise<void>;

  renewLoginByRefreshToken(refreshToken: string): Promise<string>;

  increaseRefreshTokenAttemptsUsed(refreshToken: string): Promise<void>;

  signJwtToken(userId: KeyType): Promise<string>;
}
