const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate } = require("../middleware/authenticate");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");

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

module.exports = createController(CameraStreamController)
  .prefix(AppConstants.apiRoute + "/camera-stream")
  .before([authenticate()])
  .get("/", "list")
  .get("/:id", "get")
  .post("/", "create")
  .delete("/:id", "delete")
  .patch("/:id", "update");
