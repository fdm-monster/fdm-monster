import { IdType } from "@/shared.constants";

export class RefreshTokenDto<KeyType = IdType> {
  id!: KeyType;
  userId!: KeyType;
  expiresAt!: number;
  // Not exposed
  // refreshToken!: string;
  refreshAttemptsUsed!: number;
}
