const { ValidationException, InternalServerException } = require("../../exceptions/runtime.exceptions");
const { pluginManagerCommands } = require("./constants/octoprint-service.constants");

export class PluginBaseService {
  // https://github.com/OctoPrint/OctoPrint/blob/76e87ba81329e6ce761c9307d3e80c291000871e/src/octoprint/plugins/pluginmanager/__init__.py#L609
  octoPrintApiService;
  pluginRepositoryCache;
  #pluginName;
  #pluginUrl;

  _logger;

  constructor({ octoPrintApiService, pluginRepositoryCache, loggerFactory }, { pluginName, pluginUrl }) {
    this.octoPrintApiService = octoPrintApiService;
    this.pluginRepositoryCache = pluginRepositoryCache;
    this.#pluginName = pluginName;
    this._logger = loggerFactory(`Plugin-${pluginName}`);

    const pluginReference = pluginRepositoryCache.getPlugin(pluginName);
    this.#pluginUrl = pluginUrl || pluginReference.archive;

    if (!pluginName || !pluginUrl) {
      throw new ValidationException("OctoPrint Plugin not configured correctly");
    }
  }

  get pluginName() {
    return this.#pluginName;
  }

  async isPluginUpToDate(printerLogin) {
    const response = await this.#queryInstalledPlugin(printerLogin);

    const result = this.pluginRepositoryCache.getPlugin(this.pluginName);
    return result?.github?.latest_release.name === response.version;
  }

  async #queryInstalledPlugin(printerLogin) {
    const response = await this.octoPrintApiService.getPluginManagerPlugin(printerLogin, this.pluginName);
    if (!response) {
      throw new InternalServerException("Plugin query response was empty");
    }
    return response.plugin;
  }

  async isPluginInstalled(printerLogin) {
    const foundPlugin = await this.#findPluginFromListQuery(printerLogin);
    return !!foundPlugin;
  }

  async #findPluginFromListQuery(printerLogin) {
    const response = await this.octoPrintApiService.getPluginManagerPlugins(printerLogin);
    if (!response?.plugins?.length) {
      throw new InternalServerException("Plugin query response was empty");
    }
    return this.#findPluginInList(response.plugins);
  }

  #findPluginInList(pluginList) {
    return pluginList.find((p) => p.key.toLowerCase() === this.pluginName.toLowerCase());
  }

  async updatePlugin(printerLogin) {
    return await this.octoPrintApiService.postSoftwareUpdate(printerLogin, [this.pluginName], this.#pluginUrl);
  }

  async installPlugin(printerLogin, restartAfter = false) {
    const command = pluginManagerCommands.install.name;
    const plugin = this.pluginRepositoryCache.getPlugin(this.pluginName);
    await this.octoPrintApiService.postApiPluginManagerCommand(printerLogin, command, plugin.archive);

    await this.#conditionalRestartCommand(printerLogin, restartAfter);
  }

  async uninstallPlugin(printerLogin, restartAfter = false) {
    const command = pluginManagerCommands.uninstall.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(printerLogin, command, this.pluginName);

    await this.#conditionalRestartCommand(printerLogin, restartAfter);
  }

  async enablePlugin(printerLogin, restartAfter = false) {
    const command = pluginManagerCommands.enable.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(printerLogin, command, this.pluginName);

    await this.#conditionalRestartCommand(printerLogin, restartAfter);
  }

  async disablePlugin(printerLogin, restartAfter = false) {
    const command = pluginManagerCommands.disable.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(printerLogin, command, this.pluginName);

    await this.#conditionalRestartCommand(printerLogin, restartAfter);
  }

  async cleanupPlugin(printerLogin, restartAfter = false) {
    const command = pluginManagerCommands.cleanup.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(printerLogin, command, this.pluginName);

    await this.#conditionalRestartCommand(printerLogin, restartAfter);
  }

  async cleanupAllPlugins(printerLogin, restartAfter = false) {
    const command = pluginManagerCommands.cleanup_all.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(printerLogin, command);

    await this.#conditionalRestartCommand(printerLogin, restartAfter);
  }

  async #conditionalRestartCommand(printerLogin, restartAfter = false) {
    if (!restartAfter) return;

    await this.octoPrintApiService.postSystemRestartCommand(printerLogin);
  }
}

module.exports = {
  PluginBaseService,
};
