const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");
const { printerResolveMiddleware } = require("../middleware/printer");
const { getScopedPrinter } = require("../handlers/validators");

const cacheKey = "firmware-state";

export class PluginFirmwareUpdateController {
  #cacheManager;
  /**
   * @type {PrinterCache}
   */
  printerCache;
  #pluginFirmwareUpdateService;
  #logger;

  constructor({ cacheManager, printerCache, pluginFirmwareUpdateService, loggerFactory }) {
    this.#cacheManager = cacheManager;
    this.printerCache = printerCache;
    this.#pluginFirmwareUpdateService = pluginFirmwareUpdateService;
    this.#logger = loggerFactory("PluginFirmwareUpdateController");
  }

  async listUpdateState(req, res) {
    const result = await this.#performScanOnPrinters();
    res.send(result);
  }

  /**
   * Explicit query, use with care (to prevent Github rate limit)
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async syncFirmwareReleasesCache(req, res) {
    const releases = await this.#pluginFirmwareUpdateService.queryGithubPrusaFirmwareReleasesCache();
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
      this.#logger.log("Installing firmware-update plugin");
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

  async configurePluginSettings(req, res) {
    const { printerLogin } = getScopedPrinter(req);
    const response = await this.#pluginFirmwareUpdateService.configureFirmwareUpdaterSettings(printerLogin);
    res.send(response);
  }

  async flashFirmware(req, res) {
    const { printerLogin, currentPrinterId } = getScopedPrinter(req);
    await this.#pluginFirmwareUpdateService.flashPrusaFirmware(currentPrinterId, printerLogin);

    res.send({});
  }

  async #performScanOnPrinters() {
    const printers = await this.printerCache.listCachedPrinters();
    const printerFirmwareStates = [];
    const failureStates = [];
    for (let printer of printers) {
      try {
        const loginDto = await this.printerCache.getLoginDtoAsync(printer.id);
        const isInstalled = await this.#pluginFirmwareUpdateService.isPluginInstalled(loginDto);

        let version;
        if (isInstalled) {
          version = await this.#pluginFirmwareUpdateService.getPrinterFirmwareVersion(loginDto);
        }

        printerFirmwareStates.push({
          id: printer.id,
          firmware: version,
          printerName: printer.name,
          pluginInstalled: isInstalled,
        });
      } catch (e) {
        this.#logger.warn("Firmware updater plugin scan failed", e);
        failureStates.push({
          id: printer.id,
          printerName: printer.name,
          error: e,
        });
      }
    }
    const result = {
      firmwareStates: printerFirmwareStates,
      failures: failureStates,
    };
    this.#cacheManager.set(cacheKey, result, { ttl: 3600 * 4 });
    return result;
  }
}

module.exports = createController(PluginFirmwareUpdateController)
  .prefix(AppConstants.apiRoute + "/plugin/firmware-update")
  .before([authenticate(), authorizeRoles([ROLES.OPERATOR, ROLES.ADMIN]), printerResolveMiddleware()])
  .get("/", "listUpdateState")
  .post("/releases/sync", "syncFirmwareReleasesCache")
  .post("/scan", "scanPrinterFirmwareVersions")
  .post("/download-firmware", "downloadFirmware")
  .post("/:id/install-firmware-update-plugin", "installFirmwareUpdatePlugin")
  .get("/:id/is-plugin-installed", "isPluginInstalled")
  .post("/:id/configure-plugin-settings", "configurePluginSettings")
  .get("/:id/status", "getFirmwareUpdaterStatus")
  .post("/:id/flash-firmware", "flashFirmware");
