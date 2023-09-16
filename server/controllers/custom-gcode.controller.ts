const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { AppConstants } = require("../server.constants");
const { ROLES } = require("../constants/authorization.constants");
const { validateInput, getScopedPrinter } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { printerResolveMiddleware } = require("../middleware/printer");

export class CustomGCodeController {
  #logger;
  #settingsStore;
  #octoPrintApiService;
  #customGCodeService;

  constructor({ settingsStore, customGCodeService, octoPrintApiService, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#customGCodeService = customGCodeService;
    this.#octoPrintApiService = octoPrintApiService;
    this.#logger = loggerFactory("Server-API");
  }

  async list(req, res) {
    const entities = await this.#customGCodeService.list();
    res.send(entities);
  }

  async get(req, res) {
    const { id } = await validateInput(req.params, idRules);
    const entity = await this.#customGCodeService.get(id);
    res.send(entity);
  }

  /**
   * Sends gcode according to https://docs.octoprint.org/en/master/api/printer.html#send-an-arbitrary-command-to-the-printer
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async sendEmergencyM112(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const response = await this.#octoPrintApiService.sendCustomGCodeCommand(printerLogin, "M112");
    res.send(response);
  }

  async create(req, res) {
    const createdScript = await this.#customGCodeService.create(req.body);
    res.send(createdScript);
  }

  async delete(req, res) {
    const { id } = await validateInput(req.params, idRules);
    await this.#customGCodeService.delete(id);
    res.send();
  }

  async update(req, res) {
    const { id } = await validateInput(req.params, idRules);
    const updatedScript = await this.#customGCodeService.update(id, req.body);
    res.send(updatedScript);
  }
}

// prettier-ignore
module.exports = createController(CustomGCodeController)
  .prefix(`${AppConstants.apiRoute}/custom-gcode`)
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .get("/", "list")
  .get("/:id", "get")
  .post("/", "create")
  .post("/send-emergency-m112/:printerId", "sendEmergencyM112", {before: [printerResolveMiddleware("printerId")]})
  .delete("/:id", "delete")
  .put("/:id", "update");
