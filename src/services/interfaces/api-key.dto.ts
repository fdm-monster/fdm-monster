/** Public DTO. Never includes the cleartext token or the stored hash. */
export class ApiKeyDto {
  id!: number;
  userId!: number;
  label!: string;
  prefix!: string;
  createdAt!: Date;
  lastUsedAt!: Date | null;
  roles!: string[];
}

/** Returned exactly once at creation. */
export class CreatedApiKeyDto extends ApiKeyDto {
  token!: string;
}
