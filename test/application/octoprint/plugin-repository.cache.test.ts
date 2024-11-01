import { AxiosMock } from "../../mocks/axios.mock";
import { AwilixContainer } from "awilix";
import { PluginRepositoryCache } from "@/services/octoprint/plugin-repository.cache";
import { DITokens } from "@/container.tokens";
import pluginJson from "../test-data/plugins.json";
import { setupTestApp } from "../../test-server";
import nock from "nock";

let cache: PluginRepositoryCache;

beforeAll(async () => {
  const { container } = await setupTestApp(true);
  await container.resolve(DITokens.settingsStore).loadSettings();

  cache = container.resolve(DITokens.pluginRepositoryCache);
});

describe(PluginRepositoryCache.name, () => {
  const testPlugin = "firmwareupdater";

  it("should return undefined when cache not loaded", () => {
    expect(cache.getCache()).toHaveLength(0);
    expect(cache.getPlugin("SomeName")).toBeUndefined();
  });

  it("should load cache and firmware plugin from Mocked Axios", async () => {
    nock("https://plugins.octoprint.org").get("/plugins.json").reply(200, pluginJson);
    const result = await cache.queryCache();

    expect(result).toHaveLength(356);
    expect(cache.getCache()).toHaveLength(356);

    expect(cache.getPlugin(testPlugin)).toBeDefined();
  });
});
