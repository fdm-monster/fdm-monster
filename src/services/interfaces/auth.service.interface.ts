export interface IAuthService {
  loginUser(username: string, password: string): Promise<{ token: string; refreshToken: string }>;

  logoutUserId(userId: number, jwtToken?: string): Promise<void>;

  logoutUserRefreshToken(refreshToken: string): Promise<void>;

  renewLoginByRefreshToken(refreshToken: string): Promise<string>;

  increaseRefreshTokenAttemptsUsed(refreshToken: string): Promise<void>;

  signJwtToken(userId: number): Promise<string>;
}
