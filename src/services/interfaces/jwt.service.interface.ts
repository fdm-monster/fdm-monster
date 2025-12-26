export interface IJwtService {
  signJwtToken(userId: number, username: string): Promise<string>;
}
