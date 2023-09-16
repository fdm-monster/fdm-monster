const { authenticate, withPermission } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { PERMS } = require("../constants/authorization.constants");

export class FloorController {
  #printerService;
  floorStore;

  #logger;

  constructor({ printerService, floorStore, loggerFactory }) {
    this.#printerService = printerService;
    this.floorStore = floorStore;
    this.#logger = loggerFactory("Server-API");
  }

  async create(req, res) {
    // Has internal validation
    const floor = await this.floorStore.create(req.body);
    res.send(floor);
  }

  async updateName(req, res) {
    const { id: floorId } = await validateInput(req.params, idRules);

    // Has internal validation
    const floor = await this.floorStore.updateName(floorId, req.body);
    res.send(floor);
  }

  async updateFloorNumber(req, res) {
    const { id: floorId } = await validateInput(req.params, idRules);

    // Has internal validation
    const floor = await this.floorStore.updateFloorNumber(floorId, req.body);
    res.send(floor);
  }

  async addPrinterToFloor(req, res) {
    const { id: floorId } = await validateInput(req.params, idRules);

    // Has internal validation
    const floor = await this.floorStore.addOrUpdatePrinter(floorId, req.body);
    res.send(floor);
  }

  async removePrinterFromFloor(req, res) {
    const { id: floorId } = await validateInput(req.params, idRules);

    // Has internal validation
    const floor = await this.floorStore.removePrinter(floorId, req.body);
    res.send(floor);
  }

  async list(req, res) {
    const floors = await this.floorStore.listCache();
    res.send(floors);
  }

  async get(req, res) {
    const { id: floorId } = await validateInput(req.params, idRules);
    const floor = await this.floorStore.getFloor(floorId);
    res.send(floor);
  }

  async delete(req, res) {
    const { id: floorId } = await validateInput(req.params, idRules);
    const result = await this.floorStore.delete(floorId);
    res.json(result);
  }
}

// prettier-ignore
export default createController(FloorController)
  .prefix(AppConstants.apiRoute + "/floor")
  .before([authenticate()])
  .get("/", "list", withPermission(PERMS.PrinterFloors.List))
  .get("/:id", "get", withPermission(PERMS.PrinterFloors.Get))
  .patch("/:id/name", "updateName", withPermission(PERMS.PrinterFloors.Update))
  .patch("/:id/floor-number", "updateFloorNumber", withPermission(PERMS.PrinterFloors.Update))
  .post("/:id/printer", "addPrinterToFloor", withPermission(PERMS.PrinterFloors.Update))
  .delete("/:id/printer", "removePrinterFromFloor", withPermission(PERMS.PrinterFloors.Update))
  .delete("/:id", "delete", withPermission(PERMS.PrinterFloors.Delete))
  .post("/", "create", withPermission(PERMS.PrinterFloors.Create));
