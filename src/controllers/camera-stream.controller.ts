import { route, GET, POST, PUT, DELETE, before } from "awilix-router-core";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import type { Request, Response } from "express";
import type { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";
import { ROLES } from "@/constants/authorization.constants";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(`${AppConstants.apiRoute}/camera-stream`)
@before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN])])
export class CameraStreamController {
  constructor(private readonly cameraStreamService: ICameraStreamService) {}
  @GET()
  @route("/")
  async list(req: Request, res: Response) {
    const result = await this.cameraStreamService.list();
    res.send(result.map((item) => this.cameraStreamService.toDto(item)));
  }

  @GET()
  @route("/:id")
  @before([ParamId("id")])
  async get(req: Request, res: Response) {
    const result = await this.cameraStreamService.get(req.local.id);
    res.send(this.cameraStreamService.toDto(result));
  }

  @POST()
  @route("/")
  async create(req: Request, res: Response) {
    const result = await this.cameraStreamService.create(req.body);
    res.send(this.cameraStreamService.toDto(result));
  }

  @PUT()
  @route("/:id")
  @before([ParamId("id")])
  async update(req: Request, res: Response) {
    const result = await this.cameraStreamService.update(req.local.id, req.body);
    res.send(this.cameraStreamService.toDto(result));
  }

  @DELETE()
  @route("/:id")
  @before([ParamId("id")])
  async delete(req: Request, res: Response) {
    await this.cameraStreamService.delete(req.local.id);
    res.send();
  }
}
