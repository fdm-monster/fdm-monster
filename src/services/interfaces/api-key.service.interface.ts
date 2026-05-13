import { ApiKey } from "@/entities";
import { ApiKeyDto, CreatedApiKeyDto } from "@/services/interfaces/api-key.dto";

export interface IApiKeyService {
  toDto(entity: ApiKey): ApiKeyDto;

  /** Mint a new API key for `userId` with the given roles. Returns the cleartext token exactly once. */
  create(userId: number, label: string, roleIds: number[]): Promise<CreatedApiKeyDto>;

  /** All keys across all users (admin-only feature). Never returns secrets. */
  list(): Promise<ApiKeyDto[]>;

  /** Hard-delete a key by id. Throws if id doesn't exist. */
  delete(id: number): Promise<void>;

  /**
   * Verify a presented bearer token. Returns the eager-loaded `ApiKey` row
   * (with roles) when valid; null otherwise. Side-effect: bumps `lastUsedAt`.
   */
  verify(token: string): Promise<ApiKey | null>;

  /** Cheap pre-check for "does this string look like our token shape". */
  looksLikeApiKey(token: string): boolean;
}
