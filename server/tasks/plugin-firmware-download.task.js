/**
 * @Obsolete this task is too specific and will be removed or changed
 * Plugin which downloads the latest firmware and loads firmware caches
 */
class PluginFirmwareUpdatePreparationTask {
  #logger;
  pluginRepositoryCache;
  pluginFirmwareUpdateService;

  constructor({ loggerFactory, pluginRepositoryCache, pluginFirmwareUpdateService }) {
    this.#logger = loggerFactory("Printer-FileClean-task");
    this.pluginRepositoryCache = pluginRepositoryCache;
    this.pluginFirmwareUpdateService = pluginFirmwareUpdateService;
  }

  async run() {
    try {
      await this.pluginRepositoryCache.queryCache();
      await this.pluginFirmwareUpdateService.queryGithubPrusaFirmwareReleasesCache();
      await this.pluginFirmwareUpdateService.downloadFirmware();
    } catch (e) {
      this.#logger.error("Could not fully complete loading of plugin firmware data", e);
    }
  }
}

module.exports = {
  PluginFirmwareUpdatePreparationTask
};
