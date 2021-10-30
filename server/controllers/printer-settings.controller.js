const { authenticate } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { validateInput } = require("../handlers/validators");
const { AppConstants } = require("../server.constants");
const { idRules } = require("./validation/generic.validation");
const { setGcodeAnalysis } = require("./validation/printer-settings-controller.validation");

class PrinterSettingsController {
  #printersStore;
  #jobsCache;
  #taskManagerService;
  #terminalLogsCache;
  #octoPrintApiService;
  #fileCache;
  #sseHandler;
  #sseTask;

  #logger;

  constructor({
    printersStore,
    terminalLogsCache,
    printerSseHandler,
    taskManagerService,
    printerSseTask,
    loggerFactory,
    octoPrintApiService,
    jobsCache,
    fileCache
  }) {
    this.#logger = loggerFactory("Server-API");

    this.#printersStore = printersStore;
    this.#jobsCache = jobsCache;
    this.#terminalLogsCache = terminalLogsCache;
    this.#taskManagerService = taskManagerService;
    this.#octoPrintApiService = octoPrintApiService;
    this.#fileCache = fileCache;
    this.#sseHandler = printerSseHandler;
    this.#sseTask = printerSseTask;
  }

  /**
   * Previous printerInfo action (not a list function)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async get(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const settings = await this.#octoPrintApiService.getSettings(printerLogin);

    res.send(settings);
  }

  async setGCodeAnalysis(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);
    const input = await validateInput(req.body, setGcodeAnalysis);

    const printerLogin = this.#printersStore.getPrinterLogin(printerId);

    const settings = await this.#octoPrintApiService.setGCodeAnalysis(printerLogin, input);

    res.send(settings);
  }
}

// prettier-ignore
module.exports = createController(PrinterSettingsController)
    .prefix(AppConstants.apiRoute + "/printer-settings")
    .before([authenticate])
    .get("/:id", "get")
    .post("/:id/gcode-analysis", "setGCodeAnalysis");
