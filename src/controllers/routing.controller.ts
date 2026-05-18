import type { Request, Response } from "express";
import { route, before, GET } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import type { RoutingService } from "@/services/routing.service";
import type { FileStorageService } from "@/services/file-storage.service";

@route(AppConstants.apiRoute + "/routing")
@before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN])])
export class RoutingController {
  constructor(
    private readonly routingService: RoutingService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @GET()
  @route("/resolve/:fileStorageId")
  async resolveForFile(req: Request, res: Response) {
    const metadata = await this.fileStorageService.loadMetadata(req.params.fileStorageId);
    const routingTarget: string | null = metadata?.routingTarget ?? null;
    res.send(await this.routingService.resolve(routingTarget));
  }
}
