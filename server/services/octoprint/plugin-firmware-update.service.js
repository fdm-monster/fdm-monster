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

  async queryGithubPrusaFirmwareReleasesCache() {
    this.#prusaFirmwareReleases =
      (await this.#githubApiService.getRepoGithubReleases(defaultRepos.prusaFirmare, false)) || [];

    const latestFirmware = this.#prusaFirmwareReleases[0];

    this._logger.info(
      `Plugin Cache filled with ${this.#prusaFirmwareReleases?.length || "?"} firmware releases`,
      {
        url: latestFirmware.url,
        tag_name: latestFirmware.tag_name
      }
    );

    const latestPrinterFirmware = latestFirmware.assets.find((asset) =>
      asset.name.includes("MK3S_MK3S+")
    );
    const downloadUrl = latestPrinterFirmware.browser_download_url;
    const downloadName = latestPrinterFirmware.name;
    await this.#multerService.downloadFile(downloadUrl, downloadName, firmwareDownloadPath);
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

  sendPrusaRamboConfiguration() {}

  triggerFirmwareUpdate() {}
}

module.exports = {
  PluginFirmwareUpdateService
};
