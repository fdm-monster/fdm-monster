import { createController } from "awilix-express";
import { AppConstants } from "../server.constants";
import { validateInput } from "../handlers/validators";
import { idRules } from "./validation/generic.validation";
import { authenticate } from "../middleware/authenticate";

export class CameraStreamController {
  /**
   * @type {CameraStreamService}
   */
  cameraStreamService;

  constructor({ cameraStreamService }) {
    this.cameraStreamService = cameraStreamService;
  }

  async list(req, res) {
    const result = await this.cameraStreamService.list();
    res.send(result);
  }

  async get(req, res) {
    const { id } = await validateInput(req.params, idRules);
    const result = await this.cameraStreamService.get(id);
    res.send(result);
  }

  async create(req, res) {
    const result = await this.cameraStreamService.create(req.body);
    res.send(result);
  }

  async update(req, res) {
    const { id } = await validateInput(req.params, idRules);
    const result = await this.cameraStreamService.update(id, req.body);
    res.send(result);
  }

  async delete(req, res) {
    const { id } = await validateInput(req.params, idRules);
    await this.cameraStreamService.delete(id);
    res.send({});
  }
}

export default createController(CameraStreamController)
  .prefix(AppConstants.apiRoute + "/camera-stream")
  .before([authenticate()])
  .get("/", "list")
  .get("/:id", "get")
  .post("/", "create")
  .delete("/:id", "delete")
  .patch("/:id", "update");
