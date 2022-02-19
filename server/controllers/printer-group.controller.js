import { authenticate as , withPermission } from "../middleware/authenticate.js";
import awilixExpress from "awilix-express";
import { AppConstants } from "../server.constants";
import validators from "../handlers/validators.js";
import generic from "./validation/generic.validation";
import authorization from "../constants/authorization.constants";
const { createController } = awilixExpress;
const { validateInput } = validators;
const { idRules } = generic;
const { PERMS } = authorization;
class PrinterGroupController {
    #printerService;
    #printerGroupService;
    #printerGroupsCache;
    #logger;
    constructor({ printerService, printerGroupsCache, printerGroupService, loggerFactory }) {
        this.#printerService = printerService;
        this.#printerGroupService = printerGroupService;
        this.#printerGroupsCache = printerGroupsCache;
        this.#logger = loggerFactory("Server-API");
    }
    async create(req, res) {
        // Has internal validation
        const printerGroup = await this.#printerGroupService.create(req.body);
        await this.#printerGroupsCache.loadCache();
        res.send(printerGroup);
    }
    async updateName(req, res) {
        const { id: groupId } = await validateInput(req.params, idRules);
        // Has internal validation
        const printerGroup = await this.#printerGroupService.updateName(groupId, req.body);
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
export default createController(PrinterGroupController)
    .prefix(AppConstants.apiRoute + "/printer-group")
    .before([authenticate()])
    .get("/", "list", withPermission(PERMS.PrinterGroups.List))
    .get("/:id", "get", withPermission(PERMS.PrinterGroups.Get))
    .patch("/:id/name", "updateName", withPermission(PERMS.PrinterGroups.Update))
    .post("/:id/printer", "addPrinterToGroup", withPermission(PERMS.PrinterGroups.Update))
    .delete("/:id/printer", "removePrinterFromGroup", withPermission(PERMS.PrinterGroups.Update))
    .delete("/:id", "delete", withPermission(PERMS.PrinterGroups.Delete))
    .post("/", "create", withPermission(PERMS.PrinterGroups.Create))
    .post("/sync-legacy", "syncLegacyGroups", withPermission(PERMS.PrinterGroups.Create));
