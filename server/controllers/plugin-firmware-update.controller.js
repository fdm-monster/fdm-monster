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

  async getFirmwareReleases(req, res) {}

  async downloadFirmware(req, res) {}

  async scanPrinterFirmwareVersions(req, res) {
    const result = await this.#performScanOnPrinters();
    res.send(result);
  }

  async #performScanOnPrinters() {
    const printers = this.#printersStore.listPrinterStates();
    const printerVersionMap = {};
    const failureMap = {};
    for (let printer of printers) {
      try {
        const version = await this.#pluginFirmwareUpdateService.getPrinterFirmwareVersion(
          printer.getLoginDetails()
        );

        printerVersionMap[printer.id] = {
          firmware: version,
          printerName: printer.getName()
        };
      } catch (e) {
        failureMap[printer.id] = {
          printerName: printer.getName(),
          error: e
        };
      }
    }
    this.#cacheManager.set(cacheKey, printerVersionMap, { ttl: 3600 * 4 });
    return {
      versions: printerVersionMap,
      failures: failureMap
    };
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
  .post("/scan", "scanPrinterFirmwareVersions")
  .post("/releases", "getFirmwareReleases")
  .post("/download-firmware", "downloadFirmware");
