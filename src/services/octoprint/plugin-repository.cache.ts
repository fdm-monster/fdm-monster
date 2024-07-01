import { isTestEnvironment } from "@/utils/env.utils";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { LoggerService } from "@/handlers/logger";

export class PluginRepositoryCache {
  octoprintClient: OctoprintClient;
  logger: LoggerService;

  wasCached = false;
  pluginCache = [];
  lastQueried = undefined;

  constructor({ octoprintClient, loggerFactory }: { octoprintClient: OctoprintClient; loggerFactory: ILoggerFactory }) {
    this.octoprintClient = octoprintClient;
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
    this.pluginCache = (await this.octoprintClient.fetchOctoPrintPlugins()) || [];
    this.wasCached = true;
    this.lastQueried = Date.now();

    this.logger.log(`Plugin Cache filled with ${this.pluginCache?.length || "?"} plugins`);

    return this.getCache();
  }
}
