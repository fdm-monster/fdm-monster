import { ValidationException, InternalServerException } from "@/exceptions/runtime.exceptions";
import { pluginManagerCommands } from "@/services/octoprint/constants/octoprint-service.constants";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { PluginRepositoryCache } from "@/services/octoprint/plugin-repository.cache";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoginDto } from "@/services/interfaces/login.dto";

export class PluginBaseService {
  // https://github.com/OctoPrint/OctoPrint/blob/76e87ba81329e6ce761c9307d3e80c291000871e/src/octoprint/plugins/pluginmanager/__init__.py#L609
  octoPrintApiService: OctoPrintApiService;
  pluginRepositoryCache: PluginRepositoryCache;
  private _pluginName: string;
  private _pluginUrl: string;

  protected logger: LoggerService;

  constructor(
    {
      octoPrintApiService,
      pluginRepositoryCache,
      loggerFactory,
    }: {
      octoPrintApiService: OctoPrintApiService;
      pluginRepositoryCache: PluginRepositoryCache;
      loggerFactory: ILoggerFactory;
    },
    { pluginName, pluginUrl }: { pluginName: string; pluginUrl?: string }
  ) {
    this.octoPrintApiService = octoPrintApiService;
    this.pluginRepositoryCache = pluginRepositoryCache;
    this._pluginName = pluginName;
    this.logger = loggerFactory(`Plugin-${pluginName}`);

    const pluginReference = pluginRepositoryCache.getPlugin(pluginName);
    this._pluginUrl = pluginUrl || pluginReference.archive;

    if (!pluginName || !pluginUrl) {
      throw new ValidationException("OctoPrint Plugin not configured correctly");
    }
  }

  get pluginName() {
    return this._pluginName;
  }

  async isPluginUpToDate(printerLogin: LoginDto) {
    const response = await this.#queryInstalledPlugin(printerLogin);

    const result = this.pluginRepositoryCache.getPlugin(this.pluginName);
    return result?.github?.latest_release.name === response.version;
  }

  async #queryInstalledPlugin(printerLogin: LoginDto) {
    const response = await this.octoPrintApiService.getPluginManagerPlugin(printerLogin, this.pluginName);
    if (!response) {
      throw new InternalServerException("Plugin query response was empty");
    }
    return response.plugin;
  }

  async isPluginInstalled(printerLogin: LoginDto) {
    const foundPlugin = await this.#findPluginFromListQuery(printerLogin);
    return !!foundPlugin;
  }

  async #findPluginFromListQuery(printerLogin: LoginDto) {
    const response = await this.octoPrintApiService.getPluginManagerPlugins(printerLogin);
    if (!response?.plugins?.length) {
      throw new InternalServerException("Plugin query response was empty");
    }
    return this.findPluginInList(response.plugins);
  }

  private findPluginInList(pluginList) {
    return pluginList.find((p) => p.key.toLowerCase() === this.pluginName.toLowerCase());
  }

  async updatePlugin(login: LoginDto) {
    return await this.octoPrintApiService.postSoftwareUpdate(login, [this.pluginName], this._pluginUrl);
  }

  async installPlugin(login: LoginDto, restartAfter = false) {
    const command = pluginManagerCommands.install.name;
    const plugin = this.pluginRepositoryCache.getPlugin(this.pluginName);
    await this.octoPrintApiService.postApiPluginManagerCommand(login, command, plugin.archive);

    await this.#conditionalRestartCommand(login, restartAfter);
  }

  async uninstallPlugin(login: LoginDto, restartAfter = false) {
    const command = pluginManagerCommands.uninstall.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(login, command, this.pluginName);

    await this.#conditionalRestartCommand(login, restartAfter);
  }

  async enablePlugin(login: LoginDto, restartAfter = false) {
    const command = pluginManagerCommands.enable.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(login, command, this.pluginName);

    await this.#conditionalRestartCommand(login, restartAfter);
  }

  async disablePlugin(login: LoginDto, restartAfter = false) {
    const command = pluginManagerCommands.disable.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(login, command, this.pluginName);

    await this.#conditionalRestartCommand(login, restartAfter);
  }

  async cleanupPlugin(login: LoginDto, restartAfter = false) {
    const command = pluginManagerCommands.cleanup.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(login, command, this.pluginName);

    await this.#conditionalRestartCommand(login, restartAfter);
  }

  async cleanupAllPlugins(login: LoginDto, restartAfter = false) {
    const command = pluginManagerCommands.cleanup_all.name;
    await this.octoPrintApiService.postApiPluginManagerCommand(login, command);

    await this.#conditionalRestartCommand(login, restartAfter);
  }

  async #conditionalRestartCommand(printerLogin: LoginDto, restartAfter = false) {
    if (!restartAfter) return;

    await this.octoPrintApiService.postSystemRestartCommand(printerLogin);
  }
}
