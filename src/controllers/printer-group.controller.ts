import { IPrinterGroupService } from "@/services/interfaces/printer-group.service.interface";
import { createController } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import { idRulesV2 } from "@/controllers/validation/generic.validation";
import { Request, Response } from "express";

export class PrinterGroupController {
  printerGroupService: IPrinterGroupService;
  isTypeormMode: boolean;

  constructor({ printerGroupService, isTypeormMode }: { printerGroupService: IPrinterGroupService; isTypeormMode: boolean }) {
    this.printerGroupService = printerGroupService;
    this.isTypeormMode = isTypeormMode;
  }

  async listGroups(req: Request, res: Response) {
    res.send(await this.printerGroupService.listGroups());
  }

  async getGroup(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    res.send(await this.printerGroupService.getGroupWithPrinters(id));
  }

  async createGroup(req: Request, res: Response) {
    const entity = await this.printerGroupService.createGroup(req.body);
    res.send(entity);
  }

  async updateGroupName(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const entity = await this.printerGroupService.updateGroupName(id, req.body.name);
    res.send(entity);
  }

  async deleteGroup(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    res.send(await this.printerGroupService.deleteGroup(id));
  }

  async addPrinterToGroup(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const entity = await this.printerGroupService.addPrinterToGroup(id, req.body.printerId);
    res.send(this.printerGroupService.toDto(entity));
  }

  async removePrinterFromGroup(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    res.send(await this.printerGroupService.removePrinterFromGroup(id, req.body.printerId));
  }
}

export default createController(PrinterGroupController)
  .prefix(AppConstants.apiRoute + "/printer-group")
  .before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN])])
  .get("/", "listGroups")
  .post("/", "createGroup")
  .get("/:id", "getGroup")
  .delete("/:id", "deleteGroup")
  .patch("/:id/name", "updateGroupName")
  .post("/:id/printer", "addPrinterToGroup")
  .delete("/:id/printer", "removePrinterFromGroup");
