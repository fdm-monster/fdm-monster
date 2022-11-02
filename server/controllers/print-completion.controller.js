const { authenticate, withPermission } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { PERMS } = require("../constants/authorization.constants");
const { validateInput } = require("../handlers/validators");
const { idRules } = require("./validation/generic.validation");

class PrintCompletionController {
  #printCompletionService;
  #printEventsSseTask;

  #logger;

  constructor({ printCompletionService, loggerFactory, printEventsSseTask }) {
    this.#printCompletionService = printCompletionService;
    this.#printEventsSseTask = printEventsSseTask;
    this.#logger = loggerFactory(PrintCompletionController.name);
  }

  /**
   * Not a production ready call, just for testing.
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async test(req, res) {
    const result = await this.#printCompletionService.loadPrintContexts();
    res.send(result);
  }

  contexts(req, res) {
    const contexts = this.#printEventsSseTask.contexts;
    res.send(contexts);
  }

  async findCorrelatedEntries(req, res) {
    const { correlationId } = await validateInput(req.params, { correlationId: "required|string" });
    const result = await this.#printCompletionService.findPrintCompletion(correlationId);
    res.send(result);
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
  .get("/", "list", withPermission(PERMS.PrintCompletion.List))
  .get("/test", "test", withPermission(PERMS.PrintCompletion.List))
  .get("/contexts", "contexts", withPermission(PERMS.PrintCompletion.List))
  .get("/:correlationId", "findCorrelatedEntries", withPermission(PERMS.PrintCompletion.Default));
