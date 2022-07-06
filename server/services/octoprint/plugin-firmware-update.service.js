const { PluginBaseService } = require("./plugin-base.service");

const config = {
  pluginName: "firmwareupdater",
  pluginUrl: "https://github.com/OctoPrint/OctoPrint-FirmwareUpdater/archive/master.zip"
};

class PluginFirmwareUpdateService extends PluginBaseService {
  #octoPrintApiService;

  constructor({ octoPrintApiService, printersStore, pluginRepositoryCache, loggerFactory }) {
    super({ octoPrintApiService, printersStore, pluginRepositoryCache, loggerFactory }, config);
    this.#octoPrintApiService = octoPrintApiService;
  }

  sendPrusaRamboConfiguration() {}

  triggerFirmwareUpdate() {}
}

module.exports = {
  PluginFirmwareUpdateService
};
