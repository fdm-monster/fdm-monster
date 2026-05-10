/**
 * Public DTO. Never includes the cleartext token or the stored hash.
 *
 * The `prefix` is intentionally returned so the UI can disambiguate keys when
 * the user has several active — it's the same fixed-width leading segment of
 * the original token they were shown at creation time.
 */
export interface ApiKeyDto {
  id: number;
  userId: number;
  label: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

/**
 * Returned exactly once at creation. The `token` field is the only place
 * the cleartext key is visible — server never persists it.
 */
export interface CreatedApiKeyDto extends ApiKeyDto {
  token: string;
}
