import { Request, Response } from "express";
import { FloorStore } from "@/state/floor.store";
import { PERMS } from "@/constants/authorization.constants";
import { AppConstants } from "@/server.constants";
import { POST, GET, PATCH, DELETE, before, route } from "awilix-express";
import { authenticate, permission } from "@/middleware/authenticate";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(AppConstants.apiRoute + "/floor")
@before([authenticate()])
export class FloorController {
  private floorStore: FloorStore;

  constructor({ floorStore }: { floorStore: FloorStore }) {
    this.floorStore = floorStore;
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
    const floor = await this.floorStore.getFloor(req.local.id);
    res.send(floor);
  }

  @DELETE()
  @route("/:id")
  @before([permission(PERMS.PrinterFloors.Delete), ParamId("id")])
  async delete(req: Request, res: Response) {
    await this.floorStore.delete(req.local.id);
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
    const floor = await this.floorStore.updateName(req.local.id, req.body.name);
    res.send(floor);
  }

  @PATCH()
  @route("/:id/floor-number")
  @before([permission(PERMS.PrinterFloors.Update), ParamId("id")])
  async updateFloorNumber(req: Request, res: Response) {
    const floor = await this.floorStore.updateFloorNumber(req.local.id, req.body.floor);
    res.send(floor);
  }

  @POST()
  @route("/:id/printer")
  @before([permission(PERMS.PrinterFloors.Update), ParamId("id")])
  async addPrinterToFloor(req: Request, res: Response) {
    const floor = await this.floorStore.addOrUpdatePrinter(req.local.id, req.body);
    res.send(floor);
  }

  @DELETE()
  @route("/:id/printer")
  @before([permission(PERMS.PrinterFloors.Update), ParamId("id")])
  async removePrinterFromFloor(req: Request, res: Response) {
    const floor = await this.floorStore.removePrinter(req.local.id, req.body.printerId);
    res.send(floor);
  }
}
