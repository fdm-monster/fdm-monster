const testPath = "../../";
const dbHandler = require(testPath + "db-handler");
const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const AxiosMock = require("../../mocks/axios.mock");
const awilix = require("awilix");
const pluginJson = require("../test-data/plugins.json");

let octoPrintApi;
let httpClient;
let container;
let cache;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  container.register(DITokens.httpClient, awilix.asClass(AxiosMock).singleton());
  await container.resolve(DITokens.settingsStore).loadSettings();

  octoPrintApi = container.resolve(DITokens.octoPrintApiService);
  cache = container.resolve(DITokens.pluginRepositoryCache);
  httpClient = container.resolve(DITokens.httpClient);
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("PluginRepositoryCache", () => {
  const testPlugin = "firmwareupdater";

  it("should return undefined when cache not loaded", () => {
    expect(cache.getCache()).toHaveLength(0);
    expect(cache.getPlugin("SomeName")).toBeUndefined();
  });

  it("should load cache and firmware plugin from Mocked Axios", async () => {
    httpClient.saveMockResponse(pluginJson, 200, false);
    const result = await cache.queryCache();

    expect(result).toHaveLength(356);
    expect(cache.getCache()).toHaveLength(356);

    expect(cache.getPlugin(testPlugin)).toBeDefined();
  });
});
