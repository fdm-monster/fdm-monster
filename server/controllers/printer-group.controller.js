const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const { AppConstants } = require("../app.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");

class PrinterGroupController {
  #printerService;
  #printerGroupService;
  #printerGroupsCache;

  #logger;

  constructor({ printerService, printerGroupsCache, printerGroupService, loggerFactory }) {
    this.#printerService = printerService;
    this.#printerGroupService = printerGroupService;
    this.#printerGroupsCache = printerGroupsCache;
    this.#logger = loggerFactory(PrinterGroupController.name);
  }

  async create(req, res) {
    // Has internal validation
    const printerGroup = await this.#printerGroupService.create(req.body);

    await this.#printerGroupsCache.loadCache();

    res.send(printerGroup);
  }

  async addPrinterToGroup(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerGroup = await this.#printerGroupService.addOrUpdatePrinter(groupId, req.body);

    await this.#printerGroupsCache.loadCache();

    res.send(printerGroup);
  }

  async removePrinterFromGroup(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    // Has internal validation
    const printerGroup = await this.#printerGroupService.removePrinter(groupId, req.body);

    await this.#printerGroupsCache.loadCache();

    res.send(printerGroup);
  }

  async list(req, res) {
    const groups = await this.#printerGroupsCache.getCache();

    res.send(groups);
  }

  async get(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    const groups = await this.#printerGroupsCache.getGroupId(groupId);

    res.send(groups);
  }

  async delete(req, res) {
    const { id: groupId } = await validateInput(req.params, idRules);

    const result = await this.#printerGroupService.delete(groupId);

    await this.#printerGroupsCache.loadCache();

    res.json(result);
  }

  async syncLegacyGroups(req, res) {
    const groups = await this.#printerGroupService.syncPrinterGroups();

    await this.#printerGroupsCache.loadCache();

    res.send(groups);
  }
}

// prettier-ignore
module.exports = createController(PrinterGroupController)
    .prefix(AppConstants.apiRoute + "/printer-group")
    .before([ensureAuthenticated])
    .get("/", "list")
    .get("/:id", "get")
    .post("/:id/printer", "addPrinterToGroup")
    .delete("/:id/printer", "removePrinterFromGroup")
    .delete("/:id", "delete")
    .post("/", "create")
    .post("/sync-legacy", "syncLegacyGroups");
