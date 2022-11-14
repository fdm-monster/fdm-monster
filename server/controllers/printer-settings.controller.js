const { authenticate, withPermission } = require("../middleware/authenticate");
const { createController } = require("awilix-express");
const { validateInput } = require("../handlers/validators");
const { AppConstants } = require("../server.constants");
const { idRules } = require("./validation/generic.validation");
const { setGcodeAnalysis } = require("./validation/printer-settings-controller.validation");
const { PERMS } = require("../constants/authorization.constants");

class PrinterSettingsController {
  #printersStore;
  #octoPrintApiService;

  #logger;

  constructor({ printersStore, loggerFactory, octoPrintApiService }) {
    this.#logger = loggerFactory(PrinterSettingsController.name);
    this.#printersStore = printersStore;
    this.#octoPrintApiService = octoPrintApiService;
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

  async syncPrinterName(req, res) {
    const { id: printerId } = await validateInput(req.params, idRules);

    const printerState = this.#printersStore.getPrinterState(printerId);
    const printerLogin = printerState.getLoginDetails();
    const printerName = printerState.getName();
    const settings = await this.#octoPrintApiService.updatePrinterNameSetting(
      printerLogin,
      printerName
    );
    res.send(settings);
  }
}

// prettier-ignore
module.exports = createController(PrinterSettingsController)
  .prefix(AppConstants.apiRoute + "/printer-settings")
  .before([authenticate()])
  .get("/:id", "get", withPermission(PERMS.PrinterSettings.Get))
  .post("/:id/gcode-analysis", "setGCodeAnalysis")
  .post("/:id/sync-printername", "syncPrinterName");
