const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const { ROLES } = require("../constants/authorization.constants");
const { printerResolveMiddleware } = require("../middleware/printer");

const cacheKey = "firmware-state";

class PluginFirmwareUpdateController {
  #cacheManager;
  #printersStore;
  #pluginFirmwareUpdateService;

  constructor({ cacheManager, printersStore, pluginFirmwareUpdateService }) {
    this.#cacheManager = cacheManager;
    this.#printersStore = printersStore;
    this.#pluginFirmwareUpdateService = pluginFirmwareUpdateService;
  }

  async listUpdateState(req, res) {
    let result = await this.#cacheManager.get(cacheKey);
    if (!result) {
      result = await this.#performScanOnPrinters();
    }
    res.send(result);
  }

  async listFirmwareReleasesCache(req, res) {
    res.send(this.#pluginFirmwareUpdateService.getFirmwareReleases());
  }

  async downloadFirmware(req, res) {
    await this.#pluginFirmwareUpdateService.downloadFirmware();

    res.send({});
  }

  async scanPrinterFirmwareVersions(req, res) {
    const result = await this.#performScanOnPrinters();
    res.send(result);
  }

  async #performScanOnPrinters() {
    const printers = this.#printersStore.listPrinterStates();
    const printerFirmwareStates = [];
    const failureMap = {};
    for (let printer of printers) {
      try {
        const version = await this.#pluginFirmwareUpdateService.getPrinterFirmwareVersion(
          printer.getLoginDetails()
        );

        printerFirmwareStates.push({
          id: printer.id,
          firmware: version,
          printerName: printer.getName()
        });
      } catch (e) {
        failureMap.push({
          id: printer.id,
          printerName: printer.getName(),
          error: e
        });
      }
    }
    const result = {
      versions: printerFirmwareStates,
      failures: failureMap
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
  .post("/scan", "scanPrinterFirmwareVersions")
  .post("/download-firmware", "downloadFirmware");
