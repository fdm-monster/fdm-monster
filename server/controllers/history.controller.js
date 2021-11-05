const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { AppConstants } = require("../server.constants");
const { validateInput, validateMiddleware } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { getCostSettingsDefault } = require("../constants/service.constants");
const { ROLES } = require("../constants/authorization.constants");
const HistoryModel = require("../models/History");

class HistoryController {
  #serverVersion;
  #settingsStore;
  #historyStore;
  #serverPageTitle;

  constructor({ settingsStore, serverVersion, serverPageTitle, historyStore }) {
    this.#settingsStore = settingsStore;
    this.#historyStore = historyStore;
    this.#serverVersion = serverVersion;
    this.#serverPageTitle = serverPageTitle;
  }

  async getCache(req, res) {
    const { history } = this.#historyStore.getHistoryCache();
    res.send({ history });
  }

  async stats(req, res) {
    const stats = this.#historyStore.generateStatistics();
    res.send({ history: stats });
  }

  async delete(req, res) {
    const { id: historyId } = await validateInput(req.params, idRules);

    await HistoryModel.findOneAndDelete({ _id: historyId });

    res.send();
  }

  async update(req, res) {
    const { id: historyId } = await validateInput(req.params, idRules);
    const { note } = validateMiddleware(req, {});

    const history = await HistoryModel.findById(historyId);
    history.notes = note;
    await history.save();

    res.send();
  }

  async updateCostSettings(req, res) {
    const { id } = await validateInput(req.params, idRules);

    const historyEntity = await HistoryModel.findOne({ _id: id });
    historyEntity.costSettings = getCostSettingsDefault();
    await historyEntity.save();

    res.send();
  }
}

// prettier-ignore
module.exports = createController(HistoryController)
    .prefix(AppConstants.apiRoute + "/history")
    .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
    .get("/", "getCache")
    .delete("/:id", "delete")
    .put("/:id", "update")
    .get("/stats", "stats")
    .patch("/:id/cost-settings", "updateCostMatch");
