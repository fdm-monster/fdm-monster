import { BaseService } from "@/services/orm/base.service";
import { ApiKey } from "@/entities";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import type { IApiKeyService } from "@/services/interfaces/api-key.service.interface";
import { ApiKeyDto, CreatedApiKeyDto } from "@/services/interfaces/api-key.dto";
// `ApiKeyDto` is passed to BaseService() above as a constructor argument
// (not an instance) — it's purely a generic-type marker.
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Token format: `fdmm_pat_<48 chars of base64url>`.
 * The first 16 chars after the `fdmm_pat_` separator are the indexable
 * `prefix`; the full token is hashed with SHA-256 for verification.
 *
 * SHA-256 (not bcrypt) is appropriate here because the secret has 256 bits
 * of entropy from a CSPRNG — bcrypt's slow KDF only matters for low-entropy
 * passwords. This is the same pattern GitHub / GitLab use for personal
 * access tokens.
 */
const TOKEN_PREFIX = "fdmm_pat_";
const SECRET_BYTES = 32; // 256 bits → ~43 base64url chars
const PREFIX_LEN = 16;

function generateToken(): { token: string; prefix: string; hashedSecret: string } {
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const token = `${TOKEN_PREFIX}${secret}`;
  const prefix = secret.slice(0, PREFIX_LEN);
  const hashedSecret = createHash("sha256").update(token).digest("hex");
  return { token, prefix, hashedSecret };
}

export class ApiKeyService extends BaseService(ApiKey, ApiKeyDto) implements IApiKeyService {
  private readonly logger: LoggerService;

  constructor(loggerFactory: ILoggerFactory, typeormService: TypeormService) {
    super(typeormService);
    this.logger = loggerFactory(ApiKeyService.name);
  }

  toDto(entity: ApiKey): ApiKeyDto {
    return {
      id: entity.id,
      userId: entity.userId,
      label: entity.label,
      prefix: entity.prefix,
      createdAt: entity.createdAt,
      lastUsedAt: entity.lastUsedAt,
      revokedAt: entity.revokedAt,
    };
  }

  looksLikeApiKey(token: string): boolean {
    return (
      typeof token === "string" && token.startsWith(TOKEN_PREFIX) && token.length > TOKEN_PREFIX.length + PREFIX_LEN
    );
  }

  async createForUser(userId: number, label: string): Promise<CreatedApiKeyDto> {
    const trimmed = label?.trim();
    if (!trimmed?.length) {
      throw new Error("API key label is required");
    }

    const { token, prefix, hashedSecret } = generateToken();
    const entity = await this.repository.save(
      this.repository.create({
        userId,
        label: trimmed,
        prefix,
        hashedSecret,
        lastUsedAt: null,
        revokedAt: null,
      }),
    );

    this.logger.log(`Created API key id=${entity.id} prefix=${prefix} for user ${userId}`);
    return {
      ...this.toDto(entity),
      token,
    };
  }

  async listForUser(userId: number): Promise<ApiKeyDto[]> {
    const rows = await this.repository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    return rows.map((r) => this.toDto(r));
  }

  async revokeForUser(userId: number, id: number): Promise<ApiKeyDto> {
    const row = await this.repository.findOneBy({ id, userId });
    if (!row) {
      throw new NotFoundException(`API key ${id} not found for user ${userId}`);
    }
    if (!row.revokedAt) {
      row.revokedAt = new Date();
      await this.repository.save(row);
      this.logger.log(`Revoked API key id=${id} prefix=${row.prefix} for user ${userId}`);
    }
    return this.toDto(row);
  }

  async verify(token: string): Promise<ApiKey | null> {
    if (!this.looksLikeApiKey(token)) return null;

    const secret = token.slice(TOKEN_PREFIX.length);
    const prefix = secret.slice(0, PREFIX_LEN);

    const candidate = await this.repository.findOneBy({ prefix });
    if (!candidate || candidate.revokedAt) return null;

    const presented = createHash("sha256").update(token).digest();
    const stored = Buffer.from(candidate.hashedSecret, "hex");
    if (presented.length !== stored.length || !timingSafeEqual(presented, stored)) {
      return null;
    }

    // Best-effort lastUsedAt bump. Don't block the caller on a write failure.
    this.repository
      .update({ id: candidate.id }, { lastUsedAt: new Date() })
      .catch((err) => this.logger.warn(`Failed to bump lastUsedAt for api key ${candidate.id}: ${err}`));

    return candidate;
  }
}
