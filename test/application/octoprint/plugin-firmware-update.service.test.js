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
/**
 * @type {PrinterCache}
 */
let printerCache;
let printerService;
let pluginCache;
let pluginService;
let createdPrinter;
let loginDto;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  container.register(DITokens.httpClient, awilix.asClass(AxiosMock).singleton());
  await container.resolve(DITokens.settingsStore).loadSettings();

  octoPrintApi = container.resolve(DITokens.octoPrintApiService);
  pluginService = container.resolve(DITokens.pluginFirmwareUpdateService);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  httpClient = container.resolve(DITokens.httpClient);
  pluginCache = container.resolve(DITokens.pluginRepositoryCache);

  createdPrinter = await printerService.create(validNewPrinterState);
  loginDto = await printerCache.getLoginDtoAsync(createdPrinter.id)
  httpClient.saveMockResponse(pluginJson, 200, false);
  await pluginCache.queryCache();
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
    await pluginService.isPluginInstalled(loginDto);
  });
  it("should see that plugin is up-to-date", async () => {
    httpClient.saveMockResponse(pmFUPluginResponse, 200, false);
    const result = await pluginService.isPluginUpToDate(loginDto);
    expect(result).toBeTruthy();
  });
  it("should update plugin", async () => {
    httpClient.saveMockResponse(pmFUPluginResponse, 200, false);
    const result = await pluginService.updatePlugin(loginDto);
    expect(result).toBeTruthy();
  });
  it("should be able to call install/uninstall plugin", async () => {
    httpClient.saveMockResponse(pmPluginsResponse, 200, false);
    await pluginService.installPlugin(loginDto);
    await pluginService.uninstallPlugin(loginDto);
  });
  it("should be able to install plugin with system restart", async () => {
    httpClient.saveMockResponse(pmPluginsResponse, 200, false);
    await pluginService.installPlugin(loginDto, true);
  });
  it("should be able to perform all plugin commands", async () => {
    httpClient.saveMockResponse(pmPluginsResponse, 200, false);
    await pluginService.enablePlugin(loginDto);
    await pluginService.disablePlugin(loginDto);
    await pluginService.cleanupPlugin(loginDto);
    await pluginService.cleanupAllPlugins(loginDto);
  });
});
