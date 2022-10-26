const { InfluxDB } = require("@influxdata/influxdb-client");
const { AppConstants } = require("../../server.constants");

class InfluxDbV2BaseService {
  configService;
  logger;

  constructor({ configService, loggerFactory }) {
    this.configService = configService;
    this.logger = loggerFactory(InfluxDbV2BaseService.name);
  }

  async getPointObservable(
    tags = ["3-prusa-rek3laag-rek4laag", "8-prusa-rek1laag-rek2laag", "11-k2-prusa-rekhoog"],
    measurement = "outlet"
  ) {
    const { bucket } = this.#getConfig();
    const readApi = this.#getQueryApi();

    const deviceFilterQuery =
      "|> filter(fn: (r) => " + tags.map((t) => `r["_field"] == "${t}"`).join(" or ") + ")";
    const query = `from(bucket: "${bucket}")
    |> range(start: -10s)
    |> filter(fn: (r) => r["_measurement"] == "${measurement}")
  ${deviceFilterQuery}
    |> max()`;

    return readApi.rows(query);
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

module.exports = {
  InfluxDbV2BaseService,
};
