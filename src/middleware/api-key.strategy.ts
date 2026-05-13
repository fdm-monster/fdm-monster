import { Strategy } from "passport";
import type { Request } from "express";
import type { IApiKeyService } from "@/services/interfaces/api-key.service.interface";
import type { UserDto } from "@/services/interfaces/user.dto";
import type { RoleName } from "@/constants/authorization.constants";

/**
 * Passport strategy for API-key bearer auth. Slotted between JWT and Anonymous
 * so a request with no auth header still falls through to anonymous.
 *
 * Important: we do NOT look up the bound user. The api_key_role join is the
 * sole permission source for the request — keys are self-contained credentials,
 * not user impersonation. `req.user.id = -1` is a sentinel; downstream audit
 * code can branch on it if it needs an api-key-aware identity.
 */
export class ApiKeyStrategy extends Strategy {
  name = "api-key";

  constructor(private readonly apiKeyService: IApiKeyService) {
    super();
  }

  async authenticate(req: Request, _options?: any): Promise<void> {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token || !this.apiKeyService.looksLikeApiKey(token)) {
      return this.pass();
    }

    try {
      const apiKey = await this.apiKeyService.verify(token);
      if (!apiKey) {
        return this.fail({ message: "Invalid API key" }, 401);
      }
      const principal: UserDto = {
        id: -1,
        username: `api-key:${apiKey.id}`,
        isDemoUser: false,
        isRootUser: false,
        isVerified: true,
        needsPasswordChange: false,
        createdAt: apiKey.createdAt,
        roles: (apiKey.roles ?? []).map((r) => r.name as RoleName),
      };
      return this.success(principal);
    } catch (err) {
      return this.error(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
