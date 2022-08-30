const { PluginBaseService } = require("./plugin-base.service");
const { ValidationException } = require("../../exceptions/runtime.exceptions");

const config = {
  pluginName: "firmwareupdater",
  pluginUrl: "https://github.com/OctoPrint/OctoPrint-FirmwareUpdater/archive/master.zip"
};

const defaultRepos = {
  prusaFirmare: "https://api.github.com/repos/prusa3d/Prusa-Firmware"
};

const connectivityProp = "connectivity.connection_ok";
const firmwareProp = "printer.firmware";
const firmwareDownloadPath = "firmware-downloads";

class PluginFirmwareUpdateService extends PluginBaseService {
  #octoPrintApiService;
  #githubApiService;
  #multerService;

  #prusaFirmwareReleases;
  #latestFirmware;

  constructor({
    octoPrintApiService,
    printersStore,
    pluginRepositoryCache,
    githubApiService,
    multerService,
    loggerFactory
  }) {
    super({ octoPrintApiService, printersStore, pluginRepositoryCache, loggerFactory }, config);
    this.#octoPrintApiService = octoPrintApiService;
    this.#githubApiService = githubApiService;
    this.#multerService = multerService;
  }

  getFirmwareReleases() {
    return this.#prusaFirmwareReleases;
  }

  async queryGithubPrusaFirmwareReleasesCache() {
    try {
      this.#prusaFirmwareReleases = await this.#githubApiService.getRepoGithubReleases(
        defaultRepos.prusaFirmare,
        false
      );
    } catch (e) {
      return this._logger.error(
        "Github fetch error. Probably rate limited, skipping firmware dowmload"
      );
    }

    if (!this.#prusaFirmwareReleases?.length) return [];

    this.#latestFirmware = this.#prusaFirmwareReleases[0];
    this._logger.info(
      `Plugin Cache filled with ${this.#prusaFirmwareReleases?.length || "?"} firmware releases`,
      {
        url: this.#latestFirmware.url,
        tag_name: this.#latestFirmware.tag_name
      }
    );

    return this.#prusaFirmwareReleases;
  }

  async downloadFirmware() {
    if (!this.#prusaFirmwareReleases?.length || !this.#latestFirmware) {
      throw new ValidationException(
        "No firmware releases were scanned. Download was not successful"
      );
    }

    const latestFirmware = this.#prusaFirmwareReleases[0];

    // Download the latest firmware asset
    const firmwareAsset = latestFirmware.assets.find((asset) => asset.name.includes("MK3S_MK3S+"));
    const downloadUrl = firmwareAsset.browser_download_url;
    const downloadName = firmwareAsset.name;
    this._logger.info(`Checking firmware ${downloadName}`);
    if (!this.#multerService.fileExists(downloadName, firmwareDownloadPath)) {
      await this.#multerService.downloadFile(downloadUrl, downloadName, firmwareDownloadPath);
      this._logger.info(`Downloaded firmware ${downloadName}`);
    } else {
      this._logger.info(`Found firmware ${downloadName}`);
    }
  }

  async getPrinterFirmwareVersion(printer) {
    const response = await this.#octoPrintApiService.getSystemInfo(printer);
    const systemInfo = response.systeminfo;

    if (
      !Object.keys(systemInfo).includes(connectivityProp) ||
      !Object.keys(systemInfo).includes(firmwareProp)
    ) {
      throw new ValidationException(
        "Could not retrieve printer firmware version as the OctoPrint response was not recognized"
      );
    }

    const connected = systemInfo[connectivityProp];
    if (!connected) {
      throw new ValidationException(
        "OctoPrint printer is not connected and firmware cannot be checked"
      );
    }

    const firmware = systemInfo[firmwareProp];
    if (!firmware?.length) {
      throw new ValidationException("OctoPrint firmware version property was not recognized");
    }

    return firmware;
  }

  configurePrusaRamboAvrUpdateProfile() {}

  flashPrusaFirmware() {}
}

module.exports = {
  PluginFirmwareUpdateService
};
