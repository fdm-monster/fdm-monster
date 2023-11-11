import { createController } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { validateInput } from "@/handlers/validators";
import { idRulesV2 } from "./validation/generic.validation";
import { authenticate } from "@/middleware/authenticate";
import { Request, Response } from "express";
import { ICameraStreamService } from "@/services/interfaces/camera-stream.service.interface";

export class CameraStreamController {
  private cameraStreamService: ICameraStreamService;
  private readonly isTypeormMode: boolean;

  constructor({ cameraStreamService, isTypeormMode }: { cameraStreamService: ICameraStreamService; isTypeormMode: boolean }) {
    this.cameraStreamService = cameraStreamService;
    this.isTypeormMode = isTypeormMode;
  }

  async list(req: Request, res: Response) {
    const result = await this.cameraStreamService.list();
    res.send(result.map((item) => this.cameraStreamService.toDto(item)));
  }

  async get(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const result = await this.cameraStreamService.get(id);
    res.send(this.cameraStreamService.toDto(result));
  }

  async create(req: Request, res: Response) {
    const result = await this.cameraStreamService.create(req.body);
    res.send(this.cameraStreamService.toDto(result));
  }

  async update(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const result = await this.cameraStreamService.update(id, req.body);
    res.send(this.cameraStreamService.toDto(result));
  }

  async delete(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    await this.cameraStreamService.delete(id);
    res.send();
  }
}

export default createController(CameraStreamController)
  .prefix(AppConstants.apiRoute + "/camera-stream")
  .before([authenticate()])
  .get("/", "list")
  .get("/:id", "get")
  .post("/", "create")
  .delete("/:id", "delete")
  .put("/:id", "update");
