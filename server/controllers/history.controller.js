const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { AppConstants } = require("../server.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");
const { ROLES } = require("../constants/authorization.constants");

class HistoryController {
  #settingsStore;
  #historyStore;
  #sseHandler;
  #sseTask;

  constructor({ settingsStore, historyStore, sseHandler, printEventsSseTask }) {
    this.#settingsStore = settingsStore;
    this.#historyStore = historyStore;
    this.#sseHandler = sseHandler;
    this.#sseTask = printEventsSseTask;
  }

  async sse(req, res) {
    this.#sseHandler.handleRequest(req, res, "octoprint-events");
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
}

// prettier-ignore
module.exports = createController(HistoryController)
  .prefix(AppConstants.apiRoute + "/history")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .get("/", "getCache")
  .get("/event-stream", "sse")
  .get("/stats", "stats")
  .delete("/:id", "delete");
