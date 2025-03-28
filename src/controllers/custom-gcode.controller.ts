import { createController } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import { getScopedPrinter, validateInput } from "@/handlers/validators";
import { idRulesV2 } from "./validation/generic.validation";
import { printerResolveMiddleware } from "@/middleware/printer";
import { Request, Response } from "express";
import { ICustomGcodeService } from "@/services/interfaces/custom-gcode.service.interface";

export class CustomGcodeController {
  private customGCodeService: ICustomGcodeService;

  constructor({ customGCodeService }: { customGCodeService: ICustomGcodeService }) {
    this.customGCodeService = customGCodeService;
  }

  async list(req: Request, res: Response) {
    const entities = await this.customGCodeService.list();
    res.send(entities.map((e) => this.customGCodeService.toDto(e)));
  }

  async get(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2);
    const entity = await this.customGCodeService.get(id);
    res.send(this.customGCodeService.toDto(entity));
  }

  /**
   * Sends gcode according to https://docs.octoprint.org/en/master/api/printer.html#send-an-arbitrary-command-to-the-printer
   */
  async sendEmergencyM112(req: Request, res: Response) {
    const { printerApi } = getScopedPrinter(req);
    await printerApi.quickStop();
    res.send();
  }

  async create(req: Request, res: Response) {
    const entity = await this.customGCodeService.create(req.body);
    res.send(this.customGCodeService.toDto(entity));
  }

  async delete(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2);
    await this.customGCodeService.delete(id);
    res.send();
  }

  async update(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2);
    const updatedScript = await this.customGCodeService.update(id, req.body);
    res.send(this.customGCodeService.toDto(updatedScript));
  }
}

export default createController(CustomGcodeController)
  .prefix(`${AppConstants.apiRoute}/custom-gcode`)
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .get("/", "list")
  .get("/:id", "get")
  .post("/", "create")
  .post("/send-emergency-m112/:printerId", "sendEmergencyM112", { before: [printerResolveMiddleware("printerId")] })
  .delete("/:id", "delete")
  .put("/:id", "update");
