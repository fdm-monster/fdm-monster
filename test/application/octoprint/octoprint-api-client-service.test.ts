import { DITokens } from "@/container.tokens";
import { AxiosMock } from "../../mocks/axios.mock";
import { setupTestApp } from "../../test-server";
import { AwilixContainer } from "awilix";
import { OctoPrintApiMock } from "../../mocks/octoprint-api.mock";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { OctoPrintCurrentUserDto } from "@/services/octoprint/dto/octoprint-currentuser.dto";

let octoPrintApiService: OctoPrintApiMock;
let container: AwilixContainer;
let httpClient: AxiosMock;

beforeAll(async () => {
  ({ container, httpClient, octoPrintApiService } = await setupTestApp(true));
  await container.resolve(DITokens.settingsStore).loadSettings();
});

describe(OctoPrintApiService.name, () => {
  const apiKey = "surewhynotsurewhynotsurewhynotsu";
  const printerURL = "http://someurl/";
  const auth = { apiKey, printerURL };

  beforeEach(() => {
    httpClient.saveMockResponse(undefined, 200);
  });

  it("should throw error on getSettings with incorrect printerURL", async () => {
    // TODO Not human-friendly
    await expect(
      async () =>
        await octoPrintApiService.getSettings({
          apiKey: "surewhynot",
          printerURL: "some uwrl",
        })
    ).rejects.toHaveProperty("code", "ERR_INVALID_URL");
  });

  it("should not throw error on getSettings with correct printerURL", async () => {
    const settings = await octoPrintApiService.getSettings(auth);
  });

  it("should get first admin's username when response not recognized", async () => {
    httpClient.saveMockResponse(
      {
        groups: ["admins", "users"],
        name: "rooter",
        permissions: [
          "ADMIN",
          "STATUS",
          "CONNECTION",
          "WEBCAM",
          "SYSTEM",
          "FILES_LIST",
          "FILES_UPLOAD",
          "FILES_DOWNLOAD",
          "FILES_DELETE",
          "FILES_SELECT",
          "PRINT",
          "GCODE_VIEWER",
          "MONITOR_TERMINAL",
          "CONTROL",
          "SLICE",
          "TIMELAPSE_LIST",
          "TIMELAPSE_DOWNLOAD",
          "TIMELAPSE_DELETE",
          "TIMELAPSE_MANAGE_UNRENDERED",
          "TIMELAPSE_ADMIN",
          "SETTINGS_READ",
          "SETTINGS",
          "PLUGIN_ACTION_COMMAND_NOTIFICATION_SHOW",
          "PLUGIN_ACTION_COMMAND_NOTIFICATION_CLEAR",
          "PLUGIN_ACTION_COMMAND_PROMPT_INTERACT",
          "PLUGIN_ANNOUNCEMENTS_READ",
          "PLUGIN_ANNOUNCEMENTS_MANAGE",
          "PLUGIN_APPKEYS_ADMIN",
          "PLUGIN_APPKEYS_GRANT",
          "PLUGIN_BACKUP_ACCESS",
          "PLUGIN_FIRMWARE_CHECK_DISPLAY",
          "PLUGIN_LOGGING_MANAGE",
          "PLUGIN_PLUGINMANAGER_LIST",
          "PLUGIN_PLUGINMANAGER_MANAGE",
          "PLUGIN_PLUGINMANAGER_INSTALL",
          "PLUGIN_SOFTWAREUPDATE_CHECK",
          "PLUGIN_SOFTWAREUPDATE_UPDATE",
          "PLUGIN_SOFTWAREUPDATE_CONFIGURE",
        ],
      } as OctoPrintCurrentUserDto,
      200
    );
    const adminResult = await octoPrintApiService.getAdminUserOrDefault(auth);
    expect(adminResult).toBe("rooter");
  });

  it("should pick admin user from keys", async () => {
    const usersResponse = require("../test-data/octoprint-users.response.json");
    httpClient.saveMockResponse(usersResponse, 200);
    const adminResult = await octoPrintApiService.getAdminUserOrDefault(auth);
    expect(adminResult).toBeUndefined();
  });

  it("should not throw error on getUsers", async () => {
    const usersResult = await octoPrintApiService.getUsers(auth);
    expect(usersResult).toBeUndefined();
  });

  it("should not throw error on getFiles", async () => {
    const filesResult = await octoPrintApiService.getLocalFiles(auth);
    expect(filesResult).toHaveLength(0);
  });

  it("should not throw error on getFile", async () => {
    const fileResult = await octoPrintApiService.getFile(auth, "usr/path/illegal.gcode");
    expect(fileResult).toBeUndefined();
  });

  it("should not throw error on sendJobCommand", async () => {
    const result = await octoPrintApiService.sendJobCommand(auth, { select: true });
    expect(result).toBeUndefined();
  });

  it("should not throw error on sendBedTempCommand", async () => {
    const result = await octoPrintApiService.sendBedTempCommand(auth, 50);
    expect(result).toBeUndefined();
  });

  it("should not throw error on setGCodeAnalysis", async () => {
    const result = await octoPrintApiService.setGCodeAnalysis(auth, false);
    expect(result).toBeUndefined();
  });

  it("should not throw error on createFolder", async () => {
    const result = await octoPrintApiService.createFolder(auth, "newPath", "someFolder");
    expect(result).toBeUndefined();
  });

  it("should not throw error on moveFileOrFolder", async () => {
    const result = await octoPrintApiService.moveFileOrFolder(auth, "oldPath", "newPath");
    expect(result).toBeUndefined();
  });

  it("should not throw error on selectPrintFile", async () => {
    const result = await octoPrintApiService.selectPrintFile(auth, "path", true);
    expect(result).toBeUndefined();
  });

  it("should not throw error on deleteFileOrFolder", async () => {
    const result = await octoPrintApiService.deleteFileOrFolder(auth, "path");
    expect(result).toBeUndefined();
  });

  it("should not throw error on getConnection", async () => {
    const result = await octoPrintApiService.getConnection(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getPrinterProfiles", async () => {
    const result = await octoPrintApiService.getPrinterProfiles(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getApiPluginManager", async () => {
    const result = await octoPrintApiService.getPluginManagerPlugins(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSystemInfo", async () => {
    const result = await octoPrintApiService.getSystemInfo(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSystemCommands", async () => {
    const result = await octoPrintApiService.getSystemCommands(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSoftwareUpdateCheck", async () => {
    const result = await octoPrintApiService.getSoftwareUpdateCheck(auth, false);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getPluginPiSupport", async () => {
    const result = await octoPrintApiService.getPluginPiSupport(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on deleteTimeLapse", async () => {
    const result = await octoPrintApiService.deleteTimeLapse(auth, "deletedFile");
    expect(result).toBeUndefined();
  });

  it("should not throw error on listUnrenderedTimeLapses", async () => {
    const result = await octoPrintApiService.listUnrenderedTimeLapses(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on listProfiles", async () => {
    const result = await octoPrintApiService.listProfiles(auth);
    expect(result).toBeUndefined();
  });
});
