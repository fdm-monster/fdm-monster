const { authenticate, withPermission } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { PERMS } = require("../constants/authorization.constants");

class PrinterGroupController {
  #printerService;
  #printerFloorService;

  #logger;

  constructor({ printerService, printerFloorService, loggerFactory }) {
    this.#printerService = printerService;
    this.#printerFloorService = printerFloorService;
    this.#logger = loggerFactory("Server-API");
  }

  async create(req, res) {
    // Has internal validation
    const printerFloor = await this.#printerFloorService.create(req.body);
    res.send(printerFloor);
  }

  async updateName(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerFloor = await this.#printerFloorService.updateName(groupId, req.body);
    res.send(printerFloor);
  }

  async addPrinterGroupToFloor(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerFloor = await this.#printerFloorService.addOrUpdatePrinterGroup(
      printerFloorId,
      req.body
    );
    res.send(printerFloor);
  }

  async removePrinterGroupFromFloor(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerFloor = await this.#printerFloorService.removePrinterGroup(
      printerFloorId,
      req.body
    );
    res.send(printerFloor);
  }

  async list(req, res) {
    const printerFloors = await this.#printerFloorService.list();
    res.send(printerFloors);
  }

  async get(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);
    const printerFloor = await this.#printerFloorService.get(printerFloorId);
    res.send(printerFloor);
  }

  async delete(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);
    const result = await this.#printerFloorService.delete(printerFloorId);
    res.json(result);
  }
}

// prettier-ignore
module.exports = createController(PrinterGroupController)
  .prefix(AppConstants.apiRoute + "/printer-floor")
  .before([authenticate()])
  .get("/", "list", withPermission(PERMS.PrinterGroups.List))
  .get("/:id", "get", withPermission(PERMS.PrinterGroups.Get))
  .patch("/:id/name", "updateName", withPermission(PERMS.PrinterGroups.Update))
  .post("/:id/printer-group", "addPrinterGroupToFloor", withPermission(PERMS.PrinterGroups.Update))
  .delete("/:id/printer-group", "removePrinterGroupFromFloor", withPermission(PERMS.PrinterGroups.Update))
  .delete("/:id", "delete", withPermission(PERMS.PrinterGroups.Delete))
  .post("/", "create", withPermission(PERMS.PrinterGroups.Create));
