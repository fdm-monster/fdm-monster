import { route, GET, POST, PUT, DELETE, before } from "awilix-router-core";
import { AppConstants } from "@/server.constants";
import { validateInput } from "@/handlers/validators";
import { idRulesV2 } from "./validation/generic.validation";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { Request, Response } from "express";
import { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";
import { ROLES } from "@/constants/authorization.constants";

@route(`${AppConstants.apiRoute}/camera-stream`)
@before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN])])
export class CameraStreamController {
  private readonly cameraStreamService: ICameraStreamService;
  private readonly isTypeormMode: boolean;

  constructor({ cameraStreamService, isTypeormMode }: { cameraStreamService: ICameraStreamService; isTypeormMode: boolean }) {
    this.cameraStreamService = cameraStreamService;
    this.isTypeormMode = isTypeormMode;
  }

  @GET()
  @route("/")
  async list(req: Request, res: Response) {
    const result = await this.cameraStreamService.list();
    res.send(result.map((item) => this.cameraStreamService.toDto(item)));
  }

  @GET()
  @route("/:id")
  async get(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const result = await this.cameraStreamService.get(id);
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
  async update(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const result = await this.cameraStreamService.update(id, req.body);
    res.send(this.cameraStreamService.toDto(result));
  }

  @DELETE()
  @route("/:id")
  async delete(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    await this.cameraStreamService.delete(id);
    res.send();
  }
}
