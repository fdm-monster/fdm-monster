const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const { AppConstants } = require("../app.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");

class PrinterGroupController {
  #printerService;
  #printerGroupService;

  #logger;

  constructor({ printerService, printerGroupService, loggerFactory }) {
    this.#printerService = printerService;
    this.#printerGroupService = printerGroupService;
    this.#logger = loggerFactory(PrinterGroupController.name);
  }

  async create(req, res) {
    // Has internal validation
    const printerGroup = await this.#printerGroupService.create(req.body);

    res.send(printerGroup);
  }

  async list(req, res) {
    const groups = await this.#printerGroupService.list();

    res.send(groups);
  }

  async get(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    const groups = await this.#printerGroupService.get(groupId);

    res.send(groups);
  }

  async delete(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    const result = await this.#printerGroupService.delete(groupId);

    res.json(result);
  }

  async syncLegacyGroups(req, res) {
    const groups = await this.#printerGroupService.syncPrinterGroups();
    res.send(groups);
  }
}

// prettier-ignore
module.exports = createController(PrinterGroupController)
  .prefix(AppConstants.apiRoute + "/printer-group")
  .before([ensureAuthenticated])
  .get("/", "list")
  .get("/:id", "get")
  .delete("/:id", "delete")
  .post("/", "create")
  .post("/sync-legacy", "syncLegacyGroups")
