export class RefreshTokenDto {
  id!: number;
  userId!: number;
  expiresAt!: number;
  // Not exposed
  // refreshToken!: string;
  refreshAttemptsUsed!: number;
}
