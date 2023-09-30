import { PluginBaseService } from "./plugin-base.service";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { defaultFirmwareUpdaterSettings } from "./constants/firmware-update-settings.constants";
import { MulterService } from "@/services/core/multer.service";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { GithubService } from "@/services/core/github.service";
import { PluginRepositoryCache } from "@/services/octoprint/plugin-repository.cache";
import { ILoggerFactory } from "@/handlers/logger-factory";

const config = {
  pluginName: "firmwareupdater",
  pluginUrl: "https://github.com/OctoPrint/OctoPrint-FirmwareUpdater/archive/master.zip",
};

const defaultRepos = {
  prusaFirmwareOwner: "prusa3d",
  prusaFirmwareRepo: "Prusa-Firmware",
};

const connectivityProp = "connectivity.connection_ok";
const firmwareProp = "printer.firmware";
const firmwareDownloadPath = "firmware-downloads";

export class PluginFirmwareUpdateService extends PluginBaseService {
  octoPrintApiService: OctoPrintApiService;
  githubService: GithubService;
  private multerService: MulterService;

  private prusaFirmwareReleases;
  private latestFirmware;

  constructor({
    octoPrintApiService,
    pluginRepositoryCache,
    githubService,
    multerService,
    loggerFactory,
  }: {
    octoPrintApiService: OctoPrintApiService;
    pluginRepositoryCache: PluginRepositoryCache;
    githubService: GithubService;
    multerService: MulterService;
    loggerFactory: ILoggerFactory;
  }) {
    super({ octoPrintApiService, pluginRepositoryCache, loggerFactory }, config);
    this.octoPrintApiService = octoPrintApiService;
    this.githubService = githubService;
    this.multerService = multerService;
  }

  async queryGithubPrusaFirmwareReleasesCache() {
    try {
      const response = await this.githubService.getReleases(defaultRepos.prusaFirmwareOwner, defaultRepos.prusaFirmwareRepo);
      this.prusaFirmwareReleases = response.data;
    } catch (e) {
      return this._logger.error("Github fetch error. Probably rate limited, skipping firmware dowmload");
    }

    if (!this.prusaFirmwareReleases?.length) return [];

    this.latestFirmware = this.prusaFirmwareReleases[0];
    this._logger.log(`Plugin Cache filled with ${this.prusaFirmwareReleases?.length || "?"} firmware releases`, {
      url: this.latestFirmware.url,
      tag_name: this.latestFirmware.tag_name,
    });

    return this.prusaFirmwareReleases;
  }

  async downloadFirmware() {
    if (!this.prusaFirmwareReleases?.length || !this.latestFirmware) {
      throw new ValidationException("No firmware releases were scanned. Download was not successful");
    }

    const latestFirmware = this.prusaFirmwareReleases[0];

    // Download the latest firmware asset
    const firmwareAsset = latestFirmware.assets.find((asset) => asset.name.includes("MK3S_MK3S+"));
    const downloadUrl = firmwareAsset.browser_download_url;
    const downloadName = firmwareAsset.name;
    this._logger.log(`Checking firmware ${downloadName}`);
    if (!this.multerService.fileExists(downloadName, firmwareDownloadPath)) {
      this._logger.log(`Downloading firmware from ${downloadUrl}`);
      await this.multerService.downloadFile(downloadUrl, downloadName, firmwareDownloadPath);
      this._logger.log(`Downloaded firmware ${downloadName}`);
    } else {
      this._logger.log(`Found firmware ${downloadName}`);
    }
  }

  async getPrinterFirmwareVersion(printerLogin) {
    const response = await this.octoPrintApiService.getSystemInfo(printerLogin);
    const systemInfo = response.systeminfo;

    // @todo If this fails, the printer most likely is not connected...
    if (!Object.keys(systemInfo).includes(connectivityProp) || !Object.keys(systemInfo).includes(firmwareProp)) {
      throw new ValidationException(
        "Could not retrieve printer firmware version as the OctoPrint response was not recognized. Is it connected?"
      );
    }

    const connected = systemInfo[connectivityProp];
    if (!connected) {
      throw new ValidationException("OctoPrint printer is not connected and firmware cannot be checked");
    }

    const firmware = systemInfo[firmwareProp];
    if (!firmware?.length) {
      throw new ValidationException("OctoPrint firmware version property was not recognized");
    }

    return firmware;
  }

  async getPluginFirmwareStatus(printerLogin) {
    return await this.octoPrintApiService.getPluginFirmwareUpdateStatus(printerLogin);
  }

  async configureFirmwareUpdaterSettings(printerLogin) {
    return await this.octoPrintApiService.updateFirmwareUpdaterSettings(printerLogin, defaultFirmwareUpdaterSettings);
  }

  async flashPrusaFirmware(currentPrinterId, printerLogin) {
    const latestHexFilePath = this.multerService.getNewestFile(firmwareDownloadPath);
    // todo setup BG task to track progress
    return await this.octoPrintApiService.postPluginFirmwareUpdateFlash(currentPrinterId, printerLogin, latestHexFilePath);
  }
}
