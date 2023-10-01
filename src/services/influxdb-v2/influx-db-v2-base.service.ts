import { InfluxDB } from "@influxdata/influxdb-client";
import { AppConstants } from "@/server.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { ConfigService } from "@/services/core/config.service";
import { LoggerService } from "@/handlers/logger";

export class InfluxDbV2BaseService {
  configService: ConfigService;
  logger: LoggerService;

  constructor({ configService, loggerFactory }: { configService: ConfigService; loggerFactory: ILoggerFactory }) {
    this.configService = configService;
    this.logger = loggerFactory(InfluxDbV2BaseService.name);
  }

  isConfigValid() {
    const { bucket, org, url, token } = this.#getConfig();
    return bucket && org && url && token;
  }

  #getConfig() {
    return {
      url: this.configService.get(AppConstants.influxUrl),
      token: this.configService.get(AppConstants.influxToken),
      org: this.configService.get(AppConstants.influxOrg),
      bucket: this.configService.get(AppConstants.influxBucket),
    };
  }

  #getClient() {
    const { url, token } = this.#getConfig();
    return new InfluxDB({ url, token });
  }

  #getQueryApi() {
    const { org } = this.#getConfig();
    return this.#getClient().getQueryApi(org);
  }
}
