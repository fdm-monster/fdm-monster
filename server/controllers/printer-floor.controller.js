const { authenticate, withPermission } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { PERMS } = require("../constants/authorization.constants");

class PrinterGroupController {
  #printerService;
  #printerFloorsCache;

  #logger;

  constructor({ printerService, printerFloorsCache, loggerFactory }) {
    this.#printerService = printerService;
    this.#printerFloorsCache = printerFloorsCache;
    this.#logger = loggerFactory("Server-API");
  }

  async create(req, res) {
    // Has internal validation
    const printerFloor = await this.#printerFloorsCache.create(req.body);
    res.send(printerFloor);
  }

  async updateName(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerFloor = await this.#printerFloorsCache.updateName(groupId, req.body);
    res.send(printerFloor);
  }

  async updateFloorNumber(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerFloor = await this.#printerFloorsCache.updateFloorNumber(groupId, req.body);
    res.send(printerFloor);
  }

  async addPrinterGroupToFloor(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerFloor = await this.#printerFloorsCache.addOrUpdatePrinterGroup(
      printerFloorId,
      req.body
    );
    res.send(printerFloor);
  }

  async removePrinterGroupFromFloor(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerFloor = await this.#printerFloorsCache.removePrinterGroup(
      printerFloorId,
      req.body
    );
    res.send(printerFloor);
  }

  async list(req, res) {
    const printerFloors = await this.#printerFloorsCache.listCache();
    res.send(printerFloors);
  }

  async get(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);
    const printerFloor = await this.#printerFloorsCache.getFloor(printerFloorId);
    res.send(printerFloor);
  }

  async getSelectedFloor(req, res) {
    const printerFloor = await this.#printerFloorsCache.getSelectedFloor();
    res.send(printerFloor);
  }

  async setSelectedFloor(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);
    const printerFloor = await this.#printerFloorsCache.setSelectedFloor(printerFloorId);
    res.send(printerFloor);
  }

  async delete(req, res) {
    const { id: printerFloorId } = await validateInput(req.params, idRules);
    const result = await this.#printerFloorsCache.delete(printerFloorId);
    res.json(result);
  }
}

// prettier-ignore
module.exports = createController(PrinterGroupController)
  .prefix(AppConstants.apiRoute + "/printer-floor")
  .before([authenticate()])
  .get("/", "list", withPermission(PERMS.PrinterFloors.List))
  .get("/selected-floor", "getSelectedFloor", withPermission(PERMS.PrinterFloors.Get))
  .get("/:id", "get", withPermission(PERMS.PrinterFloors.Get))
  .patch("/:id/name", "updateName", withPermission(PERMS.PrinterFloors.Update))
  .patch("/:id/floor-number", "updateFloorNumber", withPermission(PERMS.PrinterFloors.Update))
  .post("/:id/printer-group", "addPrinterGroupToFloor", withPermission(PERMS.PrinterFloors.Update))
  .delete("/:id/printer-group", "removePrinterGroupFromFloor", withPermission(PERMS.PrinterFloors.Update))
  .delete("/:id", "delete", withPermission(PERMS.PrinterFloors.Delete))
  .post("/", "create", withPermission(PERMS.PrinterFloors.Create));
