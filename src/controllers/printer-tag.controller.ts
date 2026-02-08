import type { IPrinterTagService } from "@/services/interfaces/printer-tag.service.interface";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import type { Request, Response } from "express";
import { route, before, GET, POST, DELETE, PATCH } from "awilix-express";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(AppConstants.apiRoute + "/printer-tag")
@before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN])])
export class PrinterTagController {
  constructor(private readonly printerTagService: IPrinterTagService) {}

  @GET()
  @route("/")
  async listTags(req: Request, res: Response) {
    res.send(await this.printerTagService.listTags());
  }

  @GET()
  @route("/:id")
  @before([ParamId("id")])
  async getTagWithPrinters(req: Request, res: Response) {
    res.send(await this.printerTagService.getPrintersByTag(req.local.id));
  }

  @POST()
  @route("/")
  async createTag(req: Request, res: Response) {
    // Safety mechanism against updating
    if (req.body.id) {
      delete req.body.id;
    }
    const entity = await this.printerTagService.createTag(req.body);
    res.send(entity);
  }

  @PATCH()
  @route("/:id/name")
  @before([ParamId("id")])
  async updateTagName(req: Request, res: Response) {
    const entity = await this.printerTagService.updateTagName(req.local.id, req.body.name);
    res.send(entity);
  }

  @PATCH()
  @route("/:id/color")
  @before([ParamId("id")])
  async updateTagColor(req: Request, res: Response) {
    const entity = await this.printerTagService.updateTagColor(req.local.id, req.body.color);
    res.send(entity);
  }

  @DELETE()
  @route("/:id")
  @before([ParamId("id")])
  async deleteTag(req: Request, res: Response) {
    res.send(await this.printerTagService.deleteTag(req.local.id));
  }

  @POST()
  @route("/:id/printer")
  @before([ParamId("id")])
  async addPrinterToTag(req: Request, res: Response) {
    const entity = await this.printerTagService.addPrinterToTag(req.local.id, req.body.printerId);
    res.send(this.printerTagService.toDto(entity));
  }

  @DELETE()
  @route("/:id/printer")
  @before([ParamId("id")])
  async removePrinterFromTag(req: Request, res: Response) {
    res.send(await this.printerTagService.removePrinterFromTag(req.local.id, req.body.printerId));
  }
}
