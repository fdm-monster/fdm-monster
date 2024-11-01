import nock from "nock";
import { AwilixContainer } from "awilix";
import pmPluginsResponse from "../test-data/plugin-manager-plugins.response.json";
import pmFUPluginResponse from "../test-data/plugin-manager-firmwareupdater-plugin.response.json";
import { validNewPrinterState } from "../test-data/printer.data";
import pluginJson from "../test-data/plugins.json";
import { DITokens } from "@/container.tokens";
import { PrinterCache } from "@/state/printer.cache";
import { PluginRepositoryCache } from "@/services/octoprint/plugin-repository.cache";
import { PluginFirmwareUpdateService } from "@/services/octoprint/plugin-firmware-update.service";
import { LoginDto } from "@/services/interfaces/login.dto";
import { setupTestApp } from "../../test-server";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { Printer } from "@/entities";
import { IPrinter } from "@/models/Printer";

let container: AwilixContainer;
let printerCache: PrinterCache;
let printerService: IPrinterService;
let pluginCache: PluginRepositoryCache;
let pluginService: PluginFirmwareUpdateService;
let createdPrinter: IPrinter | Printer;
let loginDto: LoginDto;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  await container.resolve(DITokens.settingsStore).loadSettings();

  pluginService = container.resolve(DITokens.pluginFirmwareUpdateService);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  pluginCache = container.resolve(DITokens.pluginRepositoryCache);

  createdPrinter = await printerService.create(validNewPrinterState);
  await printerCache.loadCache();
  loginDto = await printerCache.getLoginDtoAsync(createdPrinter.id);

  nock("https://plugins.octoprint.org/").get("/plugins.json").reply(200, require("../test-data/plugins.json"));
  await pluginCache.queryCache();
});

describe(PluginFirmwareUpdateService.name, () => {
  it("should have plugin name set", () => {
    expect(pluginService.pluginName).toBe("firmwareupdater");
  });

  it("should see that plugin is installed", async () => {
    nock(createdPrinter.printerURL).get("/plugin/pluginmanager/plugins").reply(200, pmPluginsResponse);
    await pluginService.isPluginInstalled(loginDto);
  });

  it("should see that plugin is up-to-date", async () => {
    nock(createdPrinter.printerURL).get("/plugin/pluginmanager/firmwareupdater").reply(200, pmFUPluginResponse);
    const result = await pluginService.isPluginUpToDate(loginDto);
    expect(result).toBeTruthy();
  });

  it("should update plugin", async () => {
    nock(createdPrinter.printerURL).post("/plugin/softwareupdate/update").reply(200, pmFUPluginResponse);
    const result = await pluginService.updatePlugin(loginDto);
    expect(result).toBeTruthy();
  });

  it("should be able to call install/uninstall plugin", async () => {
    nock(loginDto.printerURL).post("/api/plugin/pluginmanager").reply(200, pmPluginsResponse);
    nock(loginDto.printerURL).post("/api/plugin/pluginmanager").reply(200, pmPluginsResponse);
    await pluginService.installPlugin(loginDto);

    await pluginService.uninstallPlugin(loginDto);
  });

  it("should be able to install plugin with system restart", async () => {
    nock(createdPrinter.printerURL).post("/api/system/commands/core/restart").reply(200, {});
    nock(createdPrinter.printerURL).post("/api/plugin/pluginmanager").reply(200, pmPluginsResponse);
    await pluginService.installPlugin(loginDto, true);
  });

  it("should be able to perform all plugin commands", async () => {
    nock(createdPrinter.printerURL).post("/api/plugin/pluginmanager").reply(200, pmPluginsResponse);
    await pluginService.enablePlugin(loginDto);
    nock(createdPrinter.printerURL).post("/api/plugin/pluginmanager").reply(200, pmPluginsResponse);
    await pluginService.disablePlugin(loginDto);
    nock(createdPrinter.printerURL).post("/api/plugin/pluginmanager").reply(200, pmPluginsResponse);
    await pluginService.cleanupPlugin(loginDto);
    nock(createdPrinter.printerURL).post("/api/plugin/pluginmanager").reply(200, pmPluginsResponse);
    await pluginService.cleanupAllPlugins(loginDto);
  });
});
