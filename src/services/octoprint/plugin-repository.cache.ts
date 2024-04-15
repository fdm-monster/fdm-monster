import { isTestEnvironment } from "@/utils/env.utils";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { LoggerService } from "@/handlers/logger";

export class PluginRepositoryCache {
  octoPrintApiService: OctoPrintApiService;
  logger: LoggerService;

  wasCached = false;
  pluginCache = [];
  lastQueried = undefined;

  constructor({
    octoPrintApiService,
    loggerFactory,
  }: {
    octoPrintApiService: OctoPrintApiService;
    loggerFactory: ILoggerFactory;
  }) {
    this.octoPrintApiService = octoPrintApiService;
    this.logger = loggerFactory(PluginRepositoryCache.name);
  }

  getPlugin(pluginName: string) {
    if (!this.wasCached) {
      if (!isTestEnvironment()) {
        this.logger.warn(`Could not check plugin '${pluginName}', as cache was not loaded`);
      }
      return;
    }

    return this.getCache().find((p) => p.id.toLowerCase() === pluginName.toLowerCase());
  }

  getCache() {
    return [...this.pluginCache];
  }

  async queryCache() {
    this.pluginCache = (await this.octoPrintApiService.fetchOctoPrintPlugins()) || [];
    this.wasCached = true;
    this.lastQueried = Date.now();

    this.logger.log(`Plugin Cache filled with ${this.pluginCache?.length || "?"} plugins`);

    return this.getCache();
  }
}
