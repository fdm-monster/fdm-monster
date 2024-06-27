import { asClass, AwilixContainer } from "awilix";
import { AxiosMock } from "../../mocks/axios.mock";
import pmPluginsResponse from "../test-data/plugin-manager-plugins.response.json";
import pmFUPluginResponse from "../test-data/plugin-manager-firmwareupdater-plugin.response.json";
import { validNewPrinterState } from "../test-data/printer.data";
import pluginJson from "../test-data/plugins.json";
import { DITokens } from "@/container.tokens";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterService } from "@/services/mongoose/printer.service";
import { PluginRepositoryCache } from "@/services/octoprint/plugin-repository.cache";
import { PluginFirmwareUpdateService } from "@/services/octoprint/plugin-firmware-update.service";
import { LoginDto } from "@/services/interfaces/login.dto";
import { setupTestApp } from "../../test-server";

let httpClient: AxiosMock;
let container: AwilixContainer;
let printerCache: PrinterCache;
let printerService: PrinterService;
let pluginCache: PluginRepositoryCache;
let pluginService: PluginFirmwareUpdateService;
let createdPrinter;
let loginDto: LoginDto;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  await container.resolve(DITokens.settingsStore).loadSettings();

  pluginService = container.resolve(DITokens.pluginFirmwareUpdateService);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  httpClient = container.resolve(DITokens.httpClient);
  pluginCache = container.resolve(DITokens.pluginRepositoryCache);

  createdPrinter = await printerService.create(validNewPrinterState);
  await printerCache.loadCache();
  loginDto = await printerCache.getLoginDtoAsync(createdPrinter.id);
  httpClient.saveMockResponse(pluginJson, 200, false);
  await pluginCache.queryCache();
});

describe(PluginFirmwareUpdateService.name, () => {
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
