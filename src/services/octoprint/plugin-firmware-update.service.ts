import { PluginBaseService } from "./plugin-base.service";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { defaultFirmwareUpdaterSettings } from "./constants/firmware-update-settings.constants";
import { MulterService } from "@/services/core/multer.service";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { GithubService } from "@/services/core/github.service";
import { PluginRepositoryCache } from "@/services/octoprint/plugin-repository.cache";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoginDto } from "../interfaces/login.dto";
import { IdType } from "@/shared.constants";

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
  octoprintClient: OctoprintClient;
  githubService: GithubService;
  private multerService: MulterService;

  private prusaFirmwareReleases;
  private latestFirmware;

  constructor({
    octoprintClient,
    pluginRepositoryCache,
    githubService,
    multerService,
    loggerFactory,
  }: {
    octoprintClient: OctoprintClient;
    pluginRepositoryCache: PluginRepositoryCache;
    githubService: GithubService;
    multerService: MulterService;
    loggerFactory: ILoggerFactory;
  }) {
    super({ octoprintClient, pluginRepositoryCache, loggerFactory }, config);
    this.octoprintClient = octoprintClient;
    this.githubService = githubService;
    this.multerService = multerService;
  }

  async queryGithubPrusaFirmwareReleasesCache() {
    try {
      const response = await this.githubService.getReleases(defaultRepos.prusaFirmwareOwner, defaultRepos.prusaFirmwareRepo);
      this.prusaFirmwareReleases = response.data;
    } catch (e) {
      return this.logger.error("Github fetch error. Probably rate limited, skipping firmware download");
    }

    if (!this.prusaFirmwareReleases?.length) return [];

    this.latestFirmware = this.prusaFirmwareReleases[0];
    this.logger.log(`Plugin Cache filled with ${this.prusaFirmwareReleases?.length || "?"} firmware releases`, {
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
    this.logger.log(`Checking firmware ${downloadName}`);
    if (!this.multerService.fileExists(downloadName, firmwareDownloadPath)) {
      this.logger.log(`Downloading firmware from ${downloadUrl}`);
      await this.multerService.downloadFile(downloadUrl, downloadName, firmwareDownloadPath);
      this.logger.log(`Downloaded firmware ${downloadName}`);
    } else {
      this.logger.log(`Found firmware ${downloadName}`);
    }
  }

  async getPrinterFirmwareVersion(printerLogin: LoginDto) {
    const response = await this.octoprintClient.getSystemInfo(printerLogin);
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

  async getPluginFirmwareStatus(printerLogin: LoginDto) {
    return await this.octoprintClient.getPluginFirmwareUpdateStatus(printerLogin);
  }

  async configureFirmwareUpdaterSettings(printerLogin: LoginDto) {
    return await this.octoprintClient.updateFirmwareUpdaterSettings(printerLogin, defaultFirmwareUpdaterSettings);
  }

  async flashPrusaFirmware(currentPrinterId: IdType, printerLogin: LoginDto) {
    const latestHexFilePath = this.multerService.getNewestFile(firmwareDownloadPath);
    // todo setup BG task to track progress
    return await this.octoprintClient.postPluginFirmwareUpdateFlash(currentPrinterId, printerLogin, latestHexFilePath);
  }
}
