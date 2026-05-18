import type { Request, Response } from "express";
import { route, before, GET, POST } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import type { RoutingService } from "@/services/routing.service";

@route(AppConstants.apiRoute + "/routing")
@before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN])])
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @GET()
  @route("/resolve/:fileStorageId")
  async resolveForFile(req: Request, res: Response) {
    res.send(await this.routingService.resolveForFile(req.params.fileStorageId));
  }

  @POST()
  @route("/queue/:fileStorageId")
  async queueForFile(req: Request, res: Response) {
    res.send(await this.routingService.queueForFile(req.params.fileStorageId));
  }
}
