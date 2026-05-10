import { Strategy } from "passport";
import type { Request } from "express";
import type { IApiKeyService } from "@/services/interfaces/api-key.service.interface";
import type { IUserService } from "@/services/interfaces/user-service.interface";

/**
 * Passport strategy that authenticates a request using a long-lived API key
 * bearer token (prefix `fdmm_pat_`). Slotted between the JWT and Anonymous
 * strategies so a request with no auth header still flows through to the
 * anonymous fallback unchanged.
 *
 * On success, sets `req.user` to the same user DTO shape the JWT strategy
 * produces — so downstream `interceptRoles` / `authenticate()` /
 * `permission()` middleware works without changes.
 */
export class ApiKeyStrategy extends Strategy {
  name = "api-key";

  constructor(
    private readonly apiKeyService: IApiKeyService,
    private readonly userService: IUserService,
  ) {
    super();
  }

  async authenticate(req: Request, _options?: any): Promise<void> {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token || !this.apiKeyService.looksLikeApiKey(token)) {
      // Not our token format — let the next strategy try.
      return this.pass();
    }

    try {
      const apiKey = await this.apiKeyService.verify(token);
      if (!apiKey) {
        // Looked like an API key but didn't verify — fail (don't fall through
        // to anonymous, since the caller clearly intended bearer auth).
        return this.fail({ message: "Invalid API key" }, 401);
      }
      const user = await this.userService.getUser(apiKey.userId);
      if (!user?.isVerified) {
        return this.fail({ message: "API key user is not verified" }, 401);
      }
      return this.success(this.userService.toDto(user));
    } catch (err) {
      // `passport.Strategy.error()` is typed `(err: Error)`. Defend against a
      // non-Error throw (e.g. a string from a misbehaving dependency) instead
      // of a bare type assertion.
      return this.error(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
