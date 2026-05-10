import { ApiKey } from "@/entities";
import { ApiKeyDto, CreatedApiKeyDto } from "@/services/interfaces/api-key.dto";

export interface IApiKeyService {
  toDto(entity: ApiKey): ApiKeyDto;

  /**
   * Mint a new API key for the given user. Returns the DTO with the cleartext
   * token (only time it is ever exposed) plus stored metadata.
   */
  createForUser(userId: number, label: string): Promise<CreatedApiKeyDto>;

  /**
   * List a user's keys (active + revoked). Never returns the secret.
   */
  listForUser(userId: number): Promise<ApiKeyDto[]>;

  /**
   * Mark a key as revoked. No-op if it's already revoked. Returns the
   * updated DTO. Throws if the id doesn't belong to the user.
   */
  revokeForUser(userId: number, id: number): Promise<ApiKeyDto>;

  /**
   * Verify a presented bearer token. Returns the bound `ApiKey` row + user
   * id when the token matches a non-revoked key; null otherwise.
   *
   * Side effect: bumps `lastUsedAt`. Implemented best-effort and does not
   * block the calling request on failure.
   */
  verify(token: string): Promise<ApiKey | null>;

  /**
   * Returns true if `token` looks like an API key (correct prefix + length).
   * Cheap pre-check the auth layer can use to skip JWT parsing.
   */
  looksLikeApiKey(token: string): boolean;
}
