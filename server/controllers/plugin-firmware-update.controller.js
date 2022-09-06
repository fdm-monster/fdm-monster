const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");
const { printerResolveMiddleware } = require("../middleware/printer");
const { getScopedPrinter } = require("../handlers/validators");

const cacheKey = "firmware-state";
const cachePluginStateKey = "firmware-plugin-installed-state";

class PluginFirmwareUpdateController {
  #cacheManager;
  #printersStore;
  #pluginFirmwareUpdateService;
  #logger;

  constructor({ cacheManager, printersStore, pluginFirmwareUpdateService, loggerFactory }) {
    this.#cacheManager = cacheManager;
    this.#printersStore = printersStore;
    this.#pluginFirmwareUpdateService = pluginFirmwareUpdateService;
    this.#logger = loggerFactory("PluginFirmwareUpdateController");
  }

  async listUpdateState(req, res) {
    let result = await this.#cacheManager.get(cacheKey);
    if (!result) {
      result = await this.#performScanOnPrinters();
    }
    res.send(result);
  }

  async listFirmwareReleasesCache(req, res) {
    const releases = this.#pluginFirmwareUpdateService.getFirmwareReleases();
    res.send(releases);
  }

  /**
   * Explicit query, use with care (to prevent Github rate limit)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async syncFirmwareReleasesCache(req, res) {
    const releases =
      await this.#pluginFirmwareUpdateService.queryGithubPrusaFirmwareReleasesCache();
    res.send(releases);
  }

  async downloadFirmware(req, res) {
    await this.#pluginFirmwareUpdateService.downloadFirmware();

    res.send({});
  }

  async scanPrinterFirmwareVersions(req, res) {
    const result = await this.#performScanOnPrinters();
    res.send(result);
  }

  async isPluginInstalled(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const isInstalled = await this.#pluginFirmwareUpdateService.isPluginInstalled(printerLogin);
    res.send({ isInstalled });
  }

  async installFirmwareUpdatePlugin(req, res) {
    const { printerLogin } = getScopedPrinter(req);

    const isInstalled = await this.#pluginFirmwareUpdateService.isPluginInstalled(printerLogin);
    if (!isInstalled) {
      this.#logger.info("Installing firmware-update plugin");
      await this.#pluginFirmwareUpdateService.installPlugin(printerLogin);
      res.send({ isInstalled, installing: true });
      return;
    }

    res.send({ isInstalled, installing: false });
  }

  async getFirmwareUpdaterStatus(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const status = await this.#pluginFirmwareUpdateService.getPluginFirmwareStatus(printerLogin);
    res.send(status);
  }

  async #performScanOnPrinters() {
    const printers = this.#printersStore.listPrinterStates();
    const printerFirmwareStates = [];
    const failureStates = [];
    for (let printer of printers) {
      try {
        const version = await this.#pluginFirmwareUpdateService.getPrinterFirmwareVersion(
          printer.getLoginDetails()
        );
        const isInstalled = await this.#pluginFirmwareUpdateService.isPluginInstalled(printer.id);

        printerFirmwareStates.push({
          id: printer.id,
          firmware: version,
          printerName: printer.getName(),
          pluginInstalled: isInstalled
        });
      } catch (e) {
        failureStates.push({
          id: printer.id,
          printerName: printer.getName(),
          error: e
        });
      }
    }
    const result = {
      firmwareStates: printerFirmwareStates,
      failures: failureStates
    };
    this.#cacheManager.set(cacheKey, result, { ttl: 3600 * 4 });
    return result;
  }
}

module.exports = createController(PluginFirmwareUpdateController)
  .prefix(AppConstants.apiRoute + "/plugin/firmware-update")
  .before([
    authenticate(),
    authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN]),
    printerResolveMiddleware()
  ])
  .get("/", "listUpdateState")
  .get("/releases", "listFirmwareReleasesCache")
  .post("/releases/sync", "syncFirmwareReleasesCache")
  .post("/scan", "scanPrinterFirmwareVersions")
  .post("/download-firmware", "downloadFirmware")
  .get("/:id/is-plugin-installed", "isPluginInstalled")
  .get("/:id/status", "getFirmwareUpdaterStatus")
  .post("/:id/install-firmware-update-plugin", "installFirmwareUpdatePlugin");
