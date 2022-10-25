const { InfluxDB } = require("@influxdata/influxdb-client");
const { AppConstants } = require("../../server.constants");

class InfluxDbV2BaseService {
  configService;

  constructor({ configService }) {
    this.configService = configService;
  }

  async readPoints(tags) {
    const readApi = this.#getReadApi();

    await readApi.flush(true);
    await readApi.close();
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

  #getReadApi() {
    const { org } = this.#getConfig();
    return this.#getClient().getQueryApi(org);
  }
}

module.exports = {
  InfluxDbV2BaseService,
};
