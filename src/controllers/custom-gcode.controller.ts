import { before, DELETE, GET, POST, PUT, route } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import { printerResolveMiddleware } from "@/middleware/printer";
import { Request, Response } from "express";
import { ICustomGcodeService } from "@/services/interfaces/custom-gcode.service.interface";
import { getScopedPrinter } from "@/middleware/printer-resolver";
import { ParamId } from "@/middleware/param-converter.middleware";

@route(`${AppConstants.apiRoute}/custom-gcode`)
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
export class CustomGcodeController {
  constructor(
    private readonly customGCodeService: ICustomGcodeService
  ) {}
  /**
   * Sends gcode according to https://docs.octoprint.org/en/master/api/printer.html#send-an-arbitrary-command-to-the-printer
   */
  @POST()
  @route("/send-emergency-m112/:printerId")
  @before([printerResolveMiddleware("printerId")])
  async sendEmergencyM112(req: Request, res: Response) {
    const { printerApi } = getScopedPrinter(req);
    await printerApi.quickStop();
    res.send();
  }

  @GET()
  @route("/")
  async list(req: Request, res: Response) {
    const entities = await this.customGCodeService.list();
    res.send(entities.map((e) => this.customGCodeService.toDto(e)));
  }

  @POST()
  @route("/")
  async create(req: Request, res: Response) {
    const entity = await this.customGCodeService.create(req.body);
    res.send(this.customGCodeService.toDto(entity));
  }

  @GET()
  @route("/:id")
  @before([ParamId("id")])
  async get(req: Request, res: Response) {
    const entity = await this.customGCodeService.get(req.local.id);
    res.send(this.customGCodeService.toDto(entity));
  }

  @PUT()
  @route("/:id")
  @before([ParamId("id")])
  async update(req: Request, res: Response) {
    const updatedScript = await this.customGCodeService.update(req.local.id, req.body);
    res.send(this.customGCodeService.toDto(updatedScript));
  }

  @DELETE()
  @route("/:id")
  @before([ParamId("id")])
  async delete(req: Request, res: Response) {
    await this.customGCodeService.delete(req.local.id);
    res.send();
  }
}
