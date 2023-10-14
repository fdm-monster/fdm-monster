import { InfluxDbV2BaseService } from "@/services/influxdb-v2/influx-db-v2-base.service";
import { configureContainer } from "@/container";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";

describe(InfluxDbV2BaseService.name, () => {
  let container: AwilixContainer;
  let influxService: InfluxDbV2BaseService;
  beforeAll(() => {
    container = configureContainer();
    influxService = container.resolve<InfluxDbV2BaseService>(DITokens.influxDbV2BaseService);
  });

  it("should get influx settings and client", async () => {
    const settings = influxService.getConfig();
    expect(settings).toBeTruthy();

    expect(influxService.isConfigValid()).toBeFalsy();
  });
});
