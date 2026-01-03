import { Request, Response } from "express";
import { FloorStore } from "@/state/floor.store";
import { PERMS } from "@/constants/authorization.constants";
import { AppConstants } from "@/server.constants";
import { before, DELETE, GET, PATCH, POST, route } from "awilix-express";
import { authenticate, permission } from "@/middleware/authenticate";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(AppConstants.apiRoute + "/floor")
@before([authenticate()])
export class FloorController {
  constructor(private readonly floorStore: FloorStore) {}

  @GET()
  @route("/")
  @before([permission(PERMS.Floors.List)])
  async list(req: Request, res: Response) {
    const floors = await this.floorStore.listCache();
    res.send(floors);
  }

  @GET()
  @route("/:id")
  @before([permission(PERMS.Floors.Get), ParamId("id")])
  async get(req: Request, res: Response) {
    const floor = await this.floorStore.getFloor(req.local.id);
    res.send(floor);
  }

  @DELETE()
  @route("/:id")
  @before([permission(PERMS.Floors.Delete), ParamId("id")])
  async delete(req: Request, res: Response) {
    await this.floorStore.delete(req.local.id);
    res.send();
  }

  @POST()
  @route("/")
  @before([permission(PERMS.Floors.Create)])
  async create(req: Request, res: Response) {
    const floor = await this.floorStore.create(req.body);
    res.send(floor);
  }

  @PATCH()
  @route("/:id/name")
  @before([permission(PERMS.Floors.Update), ParamId("id")])
  async updateName(req: Request, res: Response) {
    const floor = await this.floorStore.updateName(req.local.id, req.body.name);
    res.send(floor);
  }

  @PATCH()
  @route("/:id/floor-order")
  @before([permission(PERMS.Floors.Update), ParamId("id")])
  async updateFloorOrder(req: Request, res: Response) {
    const floor = await this.floorStore.updateFloorOrder(req.local.id, req.body.order);
    res.send(floor);
  }

  @POST()
  @route("/:id/printer")
  @before([permission(PERMS.Floors.Update), ParamId("id")])
  async addPrinterToFloor(req: Request, res: Response) {
    const floor = await this.floorStore.addOrUpdatePrinter(req.local.id, req.body);
    res.send(floor);
  }

  @DELETE()
  @route("/:id/printer")
  @before([permission(PERMS.Floors.Update), ParamId("id")])
  async removePrinterFromFloor(req: Request, res: Response) {
    const floor = await this.floorStore.removePrinter(req.local.id, req.body.printerId);
    res.send(floor);
  }
}
