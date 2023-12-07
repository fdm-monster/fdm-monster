import { createController } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import { getScopedPrinter, validateInput } from "@/handlers/validators";
import { idRulesV2 } from "./validation/generic.validation";
import { printerResolveMiddleware } from "@/middleware/printer";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { Request, Response } from "express";
import { ICustomGcodeService } from "@/services/interfaces/custom-gcode.service.interface";

export class CustomGcodeController {
  private octoPrintApiService: OctoPrintApiService;
  private customGCodeService: ICustomGcodeService;
  isTypeormMode: boolean;

  constructor({
    customGCodeService,
    octoPrintApiService,
    isTypeormMode,
  }: {
    customGCodeService: ICustomGcodeService;
    octoPrintApiService: OctoPrintApiService;
    isTypeormMode: boolean;
  }) {
    this.customGCodeService = customGCodeService;
    this.octoPrintApiService = octoPrintApiService;
    this.isTypeormMode = isTypeormMode;
  }

  async list(req: Request, res: Response) {
    const entities = await this.customGCodeService.list();
    res.send(entities.map((e) => this.customGCodeService.toDto(e)));
  }

  async get(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    const entity = await this.customGCodeService.get(id);
    res.send(this.customGCodeService.toDto(entity));
  }

  /**
   * Sends gcode according to https://docs.octoprint.org/en/master/api/printer.html#send-an-arbitrary-command-to-the-printer
   */
  async sendEmergencyM112(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const response = await this.octoPrintApiService.sendCustomGCodeCommand(printerLogin, "M112");
    res.send(response);
  }

  async create(req: Request, res: Response) {
    const entity = await this.customGCodeService.create(req.body);
    res.send(this.customGCodeService.toDto(entity));
  }

  async delete(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
    await this.customGCodeService.delete(id);
    res.send();
  }

  async update(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRulesV2(this.isTypeormMode));
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
