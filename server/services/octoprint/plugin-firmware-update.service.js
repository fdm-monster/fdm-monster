const { PluginBaseService } = require("./plugin-base.service");
const { ValidationException } = require("../../exceptions/runtime.exceptions");

const config = {
  pluginName: "firmwareupdater",
  pluginUrl: "https://github.com/OctoPrint/OctoPrint-FirmwareUpdater/archive/master.zip"
};

const defaultRepos = {
  prusaFirmare: "https://github.com/prusa3d/Prusa-Firmware/"
};

const connectivityProp = "connectivity.connection_ok";
const firmwareProp = "printer.firmware";

class PluginFirmwareUpdateService extends PluginBaseService {
  #octoPrintApiService;
  #githubApiService;

  #prusaFirmwareCache;

  constructor({
    octoPrintApiService,
    printersStore,
    pluginRepositoryCache,
    githubApiService,
    loggerFactory
  }) {
    super({ octoPrintApiService, printersStore, pluginRepositoryCache, loggerFactory }, config);
    this.#octoPrintApiService = octoPrintApiService;
    this.#githubApiService = githubApiService;
  }

  async queryGithubPrusaFirmware() {
    this.#prusaFirmwareCache = await this.#githubApiService.getRepoGithubReleases(
      defaultRepos.prusaFirmare,
      false
    );
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
