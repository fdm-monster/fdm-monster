const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { AppConstants } = require("../server.constants");
const { ROLES } = require("../constants/authorization.constants");

class OctoprintEventsController {
  #settingsStore;
  #sseHandler;
  #sseTask;

  constructor({ settingsStore, sseHandler, printEventsSseTask }) {
    this.#settingsStore = settingsStore;
    this.#sseHandler = sseHandler;
    this.#sseTask = printEventsSseTask;
  }

  sse(req, res) {
    this.#sseHandler.handleRequest(req, res, "octoprint-events");
  }
}

// prettier-ignore
module.exports = createController(OctoprintEventsController)
  .prefix(AppConstants.apiRoute + "/octoprint-events")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
  .get("/sse", "sse");
