const testPath = "../../";
const dbHandler = require(testPath + "db-handler");
const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const AxiosMock = require("../../mocks/axios.mock");
const awilix = require("awilix");
const pmPluginsResponse = require("../test-data/plugin-manager-plugins.response.json");
const pmFUPluginResponse = require("../test-data/plugin-manager-firmwareupdater-plugin.response.json");
const { validNewPrinterState } = require("../test-data/printer.data");
const pluginJson = require("../test-data/plugins.json");

let octoPrintApi;
let httpClient;
let container;
let printersStore;
let pluginService;
let printerState;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  container.register(DITokens.httpClient, awilix.asClass(AxiosMock).singleton());
  await container.resolve(DITokens.settingsStore).loadSettings();

  octoPrintApi = container.resolve(DITokens.octoPrintApiService);
  pluginService = container.resolve(DITokens.pluginFirmwareUpdateService);
  printersStore = container.resolve(DITokens.printersStore);
  httpClient = container.resolve(DITokens.httpClient);
  cache = container.resolve(DITokens.pluginRepositoryCache);

  await printersStore.loadPrintersStore();
  printerState = await printersStore.addPrinter(validNewPrinterState);
  httpClient.saveMockResponse(pluginJson, 200, false);
  await cache.queryCache();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("PluginFirmwareUpdateService", () => {
  it("should have plugin name set", () => {
    expect(pluginService.pluginName).toBe("firmwareupdater");
  });

  it("should see that plugin is installed", async () => {
    httpClient.saveMockResponse(pmPluginsResponse, 200, false);
    await pluginService.isPluginInstalled(printerState.getLoginDetails());
  });
  it("should see that plugin is up-to-date", async () => {
    httpClient.saveMockResponse(pmFUPluginResponse, 200, false);
    const result = await pluginService.isPluginUpToDate(printerState.getLoginDetails());
    expect(result).toBeTruthy();
  });
  it("should update plugin", async () => {
    httpClient.saveMockResponse(pmFUPluginResponse, 200, false);
    const result = await pluginService.updatePlugin(printerState.getLoginDetails());
    expect(result).toBeTruthy();
  });
  it("should be able to call install/uninstall plugin", async () => {
    httpClient.saveMockResponse(pmPluginsResponse, 200, false);
    await pluginService.installPlugin(printerState.getLoginDetails());
    await pluginService.uninstallPlugin(printerState.getLoginDetails());
  });
  it("should be able to install plugin with system restart", async () => {
    httpClient.saveMockResponse(pmPluginsResponse, 200, false);
    await pluginService.installPlugin(printerState.getLoginDetails(), true);
  });
  it("should be able to perform all plugin commands", async () => {
    httpClient.saveMockResponse(pmPluginsResponse, 200, false);
    const printerLogin = printerState.getLoginDetails();
    await pluginService.enablePlugin(printerLogin);
    await pluginService.disablePlugin(printerLogin);
    await pluginService.cleanupPlugin(printerLogin);
    await pluginService.cleanupAllPlugins(printerLogin);
  });
});
