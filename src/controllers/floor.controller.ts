import { createController } from "awilix-express";
import { authenticate, withPermission } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { validateInput } from "@/handlers/validators";
import { idRulesV2 } from "./validation/generic.validation";
import { PERMS } from "@/constants/authorization.constants";
import { FloorStore } from "@/state/floor.store";
import { Request, Response } from "express";
import { IdType } from "@/shared.constants";

export class FloorController {
  private floorStore: FloorStore;
  private readonly isTypeormMode: boolean;

  constructor({ floorStore, isTypeormMode }: { floorStore: FloorStore; isTypeormMode: boolean }) {
    this.floorStore = floorStore;
    this.isTypeormMode = isTypeormMode;
  }

  async create(req: Request, res: Response) {
    // Has internal validation
    const floor = await this.floorStore.create(req.body);
    res.send(floor);
  }

  async updateName(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    // Has internal validation
    const floor = await this.floorStore.updateName(floorId, req.body.name);
    res.send(floor);
  }

  async updateFloorNumber(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    // Has internal validation
    const floor = await this.floorStore.updateFloorNumber(floorId, req.body.floor);
    res.send(floor);
  }

  async addPrinterToFloor(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    // Has internal validation
    const floor = await this.floorStore.addOrUpdatePrinter(floorId, req.body);
    res.send(floor);
  }

  async removePrinterFromFloor(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));

    // Has internal validation
    const floor = await this.floorStore.removePrinter(floorId, req.body.printerId);
    res.send(floor);
  }

  async list(req: Request, res: Response) {
    const floors = await this.floorStore.listCache();
    res.send(floors);
  }

  async get(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const floor = await this.floorStore.getFloor(floorId);
    res.send(floor);
  }

  async delete(req: Request, res: Response) {
    const { id: floorId } = await validateInput<{ id: IdType }>(req.params, idRulesV2(this.isTypeormMode));
    await this.floorStore.delete(floorId);
    res.send();
  }
}

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
