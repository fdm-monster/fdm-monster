const { authenticate, withPermission } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { PERMS } = require("../constants/authorization.constants");

class PrintCompletionController {
  #printCompletionService;

  #logger;

  constructor({ printCompletionService, loggerFactory }) {
    this.#printCompletionService = printCompletionService;
    this.#logger = loggerFactory(PrintCompletionController.name);
  }

  async list(req, res) {
    const completions = await this.#printCompletionService.listGroupByPrinterStatus();
    res.send(completions);
  }
}

// prettier-ignore
module.exports = createController(PrintCompletionController)
  .prefix(AppConstants.apiRoute + "/print-completion")
  .before([authenticate()])
  .get("/", "list", withPermission(PERMS.PrintCompletion.List));
