class PluginRepositoryCache {
  #octoPrintApiService;
  #logger;

  wasCached = false;
  pluginCache = [];
  lastQueried = undefined;

  constructor({ octoPrintApiService, loggerFactory }) {
    this.#octoPrintApiService = octoPrintApiService;
    this.#logger = loggerFactory("OctoPrint-PluginCache");
  }

  getPlugin(pluginName) {
    if (!this.wasCached) {
      this.#logger.warning(`Could not check plugin '${pluginName}', as cache was not loaded.`);
      return;
    }

    return this.getCache().find((p) => p.id.toLowerCase() === pluginName.toLowerCase());
  }

  getCache() {
    return [...this.pluginCache];
  }

  async queryCache() {
    this.pluginCache = (await this.#octoPrintApiService.fetchOctoPrintPlugins()) || [];
    this.wasCached = true;
    this.lastQueried = Date.now();

    this.#logger.info(`Plugin Cache filled with ${this.pluginCache?.length || "?"} plugins`);

    return this.getCache();
  }
}

module.exports = { PluginRepositoryCache };
