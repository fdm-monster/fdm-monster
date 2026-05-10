import { before, DELETE, GET, POST, route } from "awilix-express";
import { authenticate } from "@/middleware/authenticate";
import { demoUserNotAllowed } from "@/middleware/demo.middleware";
import { AppConstants } from "@/server.constants";
import { validateInput, validateMiddleware } from "@/handlers/validators";
import { apiKeyIdParamSchema, createApiKeySchema } from "@/controllers/validation/api-key-controller.validation";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import type { Request, Response } from "express";
import type { IApiKeyService } from "@/services/interfaces/api-key.service.interface";
import { AuthenticationError } from "@/exceptions/runtime.exceptions";

/**
 * Per-user API key management.
 *
 * The whole controller is gated by `authenticate()` + `demoUserNotAllowed`:
 *   - You must be a real, logged-in user to mint or list keys.
 *   - Demo users can't create persistent state.
 *
 * Authorisation is per-user: a user only ever sees their own keys. The
 * service layer enforces the userId scope on every operation.
 */
@route(AppConstants.apiRoute + "/api-keys")
@before([authenticate(), demoUserNotAllowed])
export class ApiKeyController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly apiKeyService: IApiKeyService,
  ) {
    this.logger = loggerFactory(ApiKeyController.name);
  }

  @GET()
  @route("/")
  async list(req: Request, res: Response) {
    const userId = this.requireUserId(req);
    const keys = await this.apiKeyService.listForUser(userId);
    res.send(keys);
  }

  @POST()
  @route("/")
  async create(req: Request, res: Response) {
    const userId = this.requireUserId(req);
    const { label } = await validateMiddleware(req, createApiKeySchema);
    const created = await this.apiKeyService.createForUser(userId, label);
    res.send(created);
  }

  @DELETE()
  @route("/:id")
  async revoke(req: Request, res: Response) {
    const userId = this.requireUserId(req);
    const { id } = await validateInput(req.params, apiKeyIdParamSchema);
    const revoked = await this.apiKeyService.revokeForUser(userId, id);
    res.send(revoked);
  }

  private requireUserId(req: Request): number {
    const id = req.user?.id;
    if (!id) {
      // Should never happen given the @before guards, but defend the boundary.
      throw new AuthenticationError("Authenticated user is required");
    }
    return id;
  }
}
