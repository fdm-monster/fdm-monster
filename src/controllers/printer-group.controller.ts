import { IPrinterGroupService } from "@/services/interfaces/printer-group.service.interface";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { Request, Response } from "express";
import { route, before, GET, POST, DELETE, PATCH } from "awilix-express";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(AppConstants.apiRoute + "/printer-group")
@before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN])])
export class PrinterGroupController {
  constructor(private readonly printerGroupService: IPrinterGroupService) {}

  @GET()
  @route("/")
  async listGroups(req: Request, res: Response) {
    res.send(await this.printerGroupService.listGroups());
  }

  @GET()
  @route("/:id")
  @before([ParamId("id")])
  async getGroup(req: Request, res: Response) {
    res.send(await this.printerGroupService.getGroupWithPrinters(req.local.id));
  }

  @POST()
  @route("/")
  async createGroup(req: Request, res: Response) {
    const entity = await this.printerGroupService.createGroup(req.body);
    res.send(entity);
  }

  @PATCH()
  @route("/:id/name")
  @before([ParamId("id")])
  async updateGroupName(req: Request, res: Response) {
    const entity = await this.printerGroupService.updateGroupName(req.local.id, req.body.name);
    res.send(entity);
  }

  @DELETE()
  @route("/:id")
  @before([ParamId("id")])
  async deleteGroup(req: Request, res: Response) {
    res.send(await this.printerGroupService.deleteGroup(req.local.id));
  }

  @POST()
  @route("/:id/printer")
  @before([ParamId("id")])
  async addPrinterToGroup(req: Request, res: Response) {
    const entity = await this.printerGroupService.addPrinterToGroup(req.local.id, req.body.printerId);
    res.send(this.printerGroupService.toDto(entity));
  }

  @DELETE()
  @route("/:id/printer")
  @before([ParamId("id")])
  async removePrinterFromGroup(req: Request, res: Response) {
    res.send(await this.printerGroupService.removePrinterFromGroup(req.local.id, req.body.printerId));
  }
}
