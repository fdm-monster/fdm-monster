import { BaseService } from "@/services/orm/base.service";
import { ApiKey, Role } from "@/entities";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import type { IApiKeyService } from "@/services/interfaces/api-key.service.interface";
import { ApiKeyDto, CreatedApiKeyDto } from "@/services/interfaces/api-key.dto";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { In } from "typeorm";

const TOKEN_PREFIX = "fdmm_pat_";
const SECRET_BYTES = 32;
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

  private get roleRepo() {
    return this.typeormService.getDataSource().getRepository(Role);
  }

  toDto(entity: ApiKey): ApiKeyDto {
    return {
      id: entity.id,
      userId: entity.userId,
      label: entity.label,
      prefix: entity.prefix,
      createdAt: entity.createdAt,
      lastUsedAt: entity.lastUsedAt,
      roles: (entity.roles ?? []).map((r) => r.name),
    };
  }

  looksLikeApiKey(token: string): boolean {
    return (
      typeof token === "string" && token.startsWith(TOKEN_PREFIX) && token.length > TOKEN_PREFIX.length + PREFIX_LEN
    );
  }

  async create(userId: number, label: string, roleIds: number[]): Promise<CreatedApiKeyDto> {
    const trimmed = label?.trim();
    if (!trimmed?.length) {
      throw new Error("API key label is required");
    }
    if (!roleIds?.length) {
      throw new Error("At least one role must be assigned to an API key");
    }

    const roles = await this.roleRepo.find({ where: { id: In(roleIds) } });
    if (roles.length !== roleIds.length) {
      throw new NotFoundException("One or more roleIds do not exist");
    }

    const { token, prefix, hashedSecret } = generateToken();
    const entity = await this.repository.save(
      this.repository.create({
        userId,
        label: trimmed,
        prefix,
        hashedSecret,
        lastUsedAt: null,
        roles,
      }),
    );

    this.logger.log(`Created API key id=${entity.id} prefix=${prefix} by user ${userId} with roles ${roleIds}`);
    return {
      ...this.toDto(entity),
      token,
    };
  }

  async list(): Promise<ApiKeyDto[]> {
    const rows = await this.repository.find({ order: { createdAt: "DESC" } });
    return rows.map((r) => this.toDto(r));
  }

  async delete(id: number): Promise<void> {
    const row = await this.repository.findOneBy({ id });
    if (!row) {
      throw new NotFoundException(`API key ${id} not found`);
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted API key id=${id} prefix=${row.prefix}`);
  }

  async verify(token: string): Promise<ApiKey | null> {
    if (!this.looksLikeApiKey(token)) return null;

    const secret = token.slice(TOKEN_PREFIX.length);
    const prefix = secret.slice(0, PREFIX_LEN);

    const candidate = await this.repository.findOne({ where: { prefix } });
    if (!candidate) return null;

    const presented = createHash("sha256").update(token).digest();
    const stored = Buffer.from(candidate.hashedSecret, "hex");
    if (presented.length !== stored.length || !timingSafeEqual(presented, stored)) {
      return null;
    }

    this.repository
      .update({ id: candidate.id }, { lastUsedAt: new Date() })
      .catch((err) => this.logger.warn(`Failed to bump lastUsedAt for api key ${candidate.id}: ${err}`));

    return candidate;
  }
}
