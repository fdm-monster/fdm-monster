import { createController } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { printerResolveMiddleware } from "@/middleware/printer";
import { getScopedPrinter } from "@/handlers/validators";
import { Cache } from "cache-manager";
import { PrinterCache } from "@/state/printer.cache";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { Request, Response } from "express";
import { PluginFirmwareUpdateService } from "@/services/octoprint/plugin-firmware-update.service";
import { LoggerService } from "@/handlers/logger";

const cacheKey = "firmware-state";

export class PluginFirmwareUpdateController {
  private cacheManager: Cache;
  private printerCache: PrinterCache;
  private pluginFirmwareUpdateService: PluginFirmwareUpdateService;
  private logger: LoggerService;

  constructor({
    cacheManager,
    printerCache,
    pluginFirmwareUpdateService,
    loggerFactory,
  }: {
    cacheManager: Cache;
    printerCache: PrinterCache;
    pluginFirmwareUpdateService: PluginFirmwareUpdateService;
    loggerFactory: ILoggerFactory;
  }) {
    this.cacheManager = cacheManager;
    this.printerCache = printerCache;
    this.pluginFirmwareUpdateService = pluginFirmwareUpdateService;
    this.logger = loggerFactory(PluginFirmwareUpdateController.name);
  }

  async listUpdateState(req: Request, res: Response) {
    const result = await this.performScanOnPrinters();
    res.send(result);
  }

  /**
   * Explicit query, use with care (to prevent Github rate limit)
   */
  async syncFirmwareReleasesCache(req: Request, res: Response) {
    const releases = await this.pluginFirmwareUpdateService.queryGithubPrusaFirmwareReleasesCache();
    res.send(releases);
  }

  async downloadFirmware(req: Request, res: Response) {
    await this.pluginFirmwareUpdateService.downloadFirmware();
    res.send({});
  }

  async scanPrinterFirmwareVersions(req: Request, res: Response) {
    const result = await this.performScanOnPrinters();
    res.send(result);
  }

  async isPluginInstalled(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const isInstalled = await this.pluginFirmwareUpdateService.isPluginInstalled(printerLogin);
    res.send({ isInstalled });
  }

  async installFirmwareUpdatePlugin(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const isInstalled = await this.pluginFirmwareUpdateService.isPluginInstalled(printerLogin);
    if (!isInstalled) {
      await this.pluginFirmwareUpdateService.installPlugin(printerLogin);
      res.send({ isInstalled, installing: true });
      return;
    }

    res.send({ isInstalled, installing: false });
  }

  async getFirmwareUpdaterStatus(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const status = await this.pluginFirmwareUpdateService.getPluginFirmwareStatus(printerLogin);
    res.send(status);
  }

  async configurePluginSettings(req: Request, res: Response) {
    const { printerLogin } = getScopedPrinter(req);
    const response = await this.pluginFirmwareUpdateService.configureFirmwareUpdaterSettings(printerLogin);
    res.send(response);
  }

  async flashFirmware(req: Request, res: Response) {
    const { printerLogin, currentPrinterId } = getScopedPrinter(req);
    await this.pluginFirmwareUpdateService.flashPrusaFirmware(currentPrinterId, printerLogin);

    res.send({});
  }

  async performScanOnPrinters() {
    const printers = await this.printerCache.listCachedPrinters();
    const printerFirmwareStates = [];
    const failureStates = [];
    for (let printer of printers) {
      try {
        const loginDto = await this.printerCache.getLoginDtoAsync(printer.id);
        const isInstalled = await this.pluginFirmwareUpdateService.isPluginInstalled(loginDto);

        let version;
        if (isInstalled) {
          version = await this.pluginFirmwareUpdateService.getPrinterFirmwareVersion(loginDto);
        }

        printerFirmwareStates.push({
          id: printer.id,
          firmware: version,
          printerName: printer.name,
          pluginInstalled: isInstalled,
        });
      } catch (e) {
        this.logger.error("Firmware updater plugin scan failed with an error");
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
    await this.cacheManager.set(cacheKey, result, { ttl: 3600 * 4 });
    return result;
  }
}

export default createController(PluginFirmwareUpdateController)
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
