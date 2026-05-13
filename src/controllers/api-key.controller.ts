import { before, DELETE, GET, POST, route } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { demoUserNotAllowed } from "@/middleware/demo.middleware";
import { ROLES } from "@/constants/authorization.constants";
import { AppConstants } from "@/server.constants";
import { validateInput, validateMiddleware } from "@/handlers/validators";
import { apiKeyIdParamSchema, createApiKeySchema } from "@/controllers/validation/api-key-controller.validation";
import type { Request, Response } from "express";
import type { IApiKeyService } from "@/services/interfaces/api-key.service.interface";
import { AuthenticationError } from "@/exceptions/runtime.exceptions";

/**
 * Admin-only API key management. Keys are m2m credentials with their own
 * role assignment (stored in the `api_key_role` join table); they are NOT
 * user impersonation tokens. `createdByUserId` is audit-only — it records
 * who minted the key, not whose permissions the key holds.
 */
@route(AppConstants.apiRoute + "/api-keys")
@before([authenticate(), authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
export class ApiKeyController {
  constructor(private readonly apiKeyService: IApiKeyService) {}

  @GET()
  @route("/")
  async list(_req: Request, res: Response) {
    const keys = await this.apiKeyService.list();
    res.send(keys);
  }

  @POST()
  @route("/")
  async create(req: Request, res: Response) {
    const createdByUserId = this.requireUserId(req);
    const { label, roleIds } = await validateMiddleware(req, createApiKeySchema);
    const created = await this.apiKeyService.create(createdByUserId, label, roleIds);
    res.send(created);
  }

  @DELETE()
  @route("/:id")
  async delete(req: Request, res: Response) {
    const { id } = await validateInput(req.params, apiKeyIdParamSchema);
    await this.apiKeyService.delete(id);
    res.status(204).send();
  }

  private requireUserId(req: Request): number {
    // Reachable when loginRequired=false (passport-anonymous falls through
    // without setting req.user); the @before authorizeRoles guard then
    // refuses, but defend the boundary anyway in case the chain is changed.
    const id = req.user?.id;
    if (!id || id < 0) {
      throw new AuthenticationError("Authenticated user is required");
    }
    return id;
  }
}
