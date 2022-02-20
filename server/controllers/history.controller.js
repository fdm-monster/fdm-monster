const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { AppConstants } = require("../server.constants");
const { validateInput, validateMiddleware } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { getCostSettingsDefault } = require("../constants/service.constants");
const { ROLES } = require("../constants/authorization.constants");

class HistoryController {
  #settingsStore;
  #historyStore;

  constructor({ settingsStore, historyStore }) {
    this.#settingsStore = settingsStore;
    this.#historyStore = historyStore;
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
    const { id } = await validateInput(req.params, idRules);

    await this.#historyStore.deleteEntry(id);

    res.send();
  }

  async updateCostSettings(req, res) {
    const { id } = await validateInput(req.params, idRules);

    const result = await this.#historyStore.updateCostSettings(id, getCostSettingsDefault());

    res.send(result);
  }
}

// prettier-ignore
module.exports = createController(HistoryController)
    .prefix(AppConstants.apiRoute + "/history")
    .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
    .get("/", "getCache")
    .delete("/:id", "delete")
    // .put("/:id", "update")
    .get("/stats", "stats")
    .patch("/:id/cost-settings", "updateCostSettings");
