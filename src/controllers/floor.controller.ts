import { Request, Response } from "express";
import { FloorStore } from "@/state/floor.store";
import { validateInput } from "@/handlers/validators";
import { idRulesV2 } from "./validation/generic.validation";
import { PERMS } from "@/constants/authorization.constants";
import { AppConstants } from "@/server.constants";
import { POST, GET, PATCH, DELETE, before, route } from "awilix-express";
import { authenticate, permission } from "@/middleware/authenticate";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(AppConstants.apiRoute + "/floor")
@before([authenticate()])
export class FloorController {
  private floorStore: FloorStore;
  private readonly isTypeormMode: boolean;

  constructor({ floorStore, isTypeormMode }: { floorStore: FloorStore; isTypeormMode: boolean }) {
    this.floorStore = floorStore;
    this.isTypeormMode = isTypeormMode;
  }

  @GET()
  @route("/")
  @before([permission(PERMS.PrinterFloors.List)])
  async list(req: Request, res: Response) {
    const floors = await this.floorStore.listCache();
    res.send(floors);
  }

  @GET()
  @route("/:id")
  @before([permission(PERMS.PrinterFloors.Get), ParamId("id")])
  async get(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.local, idRulesV2(this.isTypeormMode));
    const floor = await this.floorStore.getFloor(floorId);
    res.send(floor);
  }

  @DELETE()
  @route("/:id")
  @before([permission(PERMS.PrinterFloors.Delete), ParamId("id")])
  async delete(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.local, idRulesV2(this.isTypeormMode));
    await this.floorStore.delete(floorId);
    res.send();
  }

  @POST()
  @route("/")
  @before([permission(PERMS.PrinterFloors.Create)])
  async create(req: Request, res: Response) {
    const floor = await this.floorStore.create(req.body);
    res.send(floor);
  }

  @PATCH()
  @route("/:id/name")
  @before([permission(PERMS.PrinterFloors.Update), ParamId("id")])
  async updateName(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.local, idRulesV2(this.isTypeormMode));

    // Has internal validation
    const floor = await this.floorStore.updateName(floorId, req.body.name);
    res.send(floor);
  }

  @PATCH()
  @route("/:id/floor-number")
  @before([permission(PERMS.PrinterFloors.Update), ParamId("id")])
  async updateFloorNumber(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.local, idRulesV2(this.isTypeormMode));

    // Has internal validation
    const floor = await this.floorStore.updateFloorNumber(floorId, req.body.floor);
    res.send(floor);
  }

  @POST()
  @route("/:id/printer")
  @before([permission(PERMS.PrinterFloors.Update), ParamId("id")])
  async addPrinterToFloor(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.local, idRulesV2(this.isTypeormMode));

    // Has internal validation
    req.body.floorId = floorId;
    const floor = await this.floorStore.addOrUpdatePrinter(floorId, req.body);
    res.send(floor);
  }

  @DELETE()
  @route("/:id/printer")
  @before([permission(PERMS.PrinterFloors.Update), ParamId("id")])
  async removePrinterFromFloor(req: Request, res: Response) {
    const { id: floorId } = await validateInput(req.local, idRulesV2(this.isTypeormMode));

    // Has internal validation
    const floor = await this.floorStore.removePrinter(floorId, req.body.printerId);
    res.send(floor);
  }
}
