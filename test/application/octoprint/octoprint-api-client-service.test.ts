import { DITokens } from "@/container.tokens";
import { AxiosMock } from "../../mocks/axios.mock";
import { setupTestApp } from "../../test-server";
import { AwilixContainer } from "awilix";
import { OctoPrintApiMock } from "../../mocks/octoprint-api.mock";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { CurrentUserDto } from "@/services/octoprint/dto/auth/current-user.dto";
import { OctoprintType } from "@/services/printer-api.interface";

let octoprintClient: OctoPrintApiMock;
let container: AwilixContainer;
let httpClient: AxiosMock;

beforeAll(async () => {
  ({ container, httpClient, octoprintClient } = await setupTestApp(true));
  await container.resolve(DITokens.settingsStore).loadSettings();
});

describe(OctoprintClient.name, () => {
  const apiKey = "surewhynotsurewhynotsurewhynotsu";
  const printerURL = "http://someurl/";
  const auth = { apiKey, printerURL, printerType: OctoprintType };

  beforeEach(() => {
    httpClient.saveMockResponse(undefined, 200);
  });

  it("should throw error on getSettings with incorrect printerURL", async () => {
    // TODO Not human-friendly
    await expect(
      async () =>
        await octoprintClient.getSettings({
          apiKey: "surewhynot",
          printerURL: "some uwrl",
          printerType: OctoprintType,
        })
    ).rejects.toHaveProperty("code", "ERR_INVALID_URL");
  });

  it("should not throw error on getSettings with correct printerURL", async () => {
    await octoprintClient.getSettings(auth);
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
      } as CurrentUserDto,
      200
    );
    const adminResult = await octoprintClient.getAdminUserOrDefault(auth);
    expect(adminResult).toBe("rooter");
  });

  it("should pick admin user from keys", async () => {
    const usersResponse = require("../test-data/octoprint-users.response.json");
    httpClient.saveMockResponse(usersResponse, 200);
    const adminResult = await octoprintClient.getAdminUserOrDefault(auth);
    expect(adminResult).toBeUndefined();
  });

  it("should not throw error on getUsers", async () => {
    const usersResult = await octoprintClient.getUsers(auth);
    expect(usersResult).toBeUndefined();
  });

  it("should not throw error on getFiles", async () => {
    const filesResult = await octoprintClient.getLocalFiles(auth);
    expect(filesResult).toHaveLength(0);
  });

  it("should not throw error on getFile", async () => {
    const fileResult = await octoprintClient.getFile(auth, "usr/path/illegal.gcode");
    expect(fileResult).toBeUndefined();
  });

  it("should not throw error on sendJobCommand", async () => {
    const result = await octoprintClient.sendJobCommand(auth, { select: true });
    expect(result).toBeUndefined();
  });

  it("should not throw error on sendBedTempCommand", async () => {
    const result = await octoprintClient.sendBedTempCommand(auth, 50);
    expect(result).toBeUndefined();
  });

  it("should not throw error on setGCodeAnalysis", async () => {
    const result = await octoprintClient.setGCodeAnalysis(auth, false);
    expect(result).toBeUndefined();
  });

  it("should not throw error on createFolder", async () => {
    const result = await octoprintClient.createFolder(auth, "newPath", "someFolder");
    expect(result).toBeUndefined();
  });

  it("should not throw error on moveFileOrFolder", async () => {
    const result = await octoprintClient.moveFileOrFolder(auth, "oldPath", "newPath");
    expect(result).toBeUndefined();
  });

  it("should not throw error on selectPrintFile", async () => {
    const result = await octoprintClient.postSelectPrintFile(auth, "path", true);
    expect(result).toBeUndefined();
  });

  it("should not throw error on deleteFileOrFolder", async () => {
    const result = await octoprintClient.deleteFileOrFolder(auth, "path");
    expect(result).toBeUndefined();
  });

  it("should not throw error on getConnection", async () => {
    const result = await octoprintClient.getConnection(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getPrinterProfiles", async () => {
    const result = await octoprintClient.getPrinterProfiles(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getApiPluginManager", async () => {
    const result = await octoprintClient.getPluginManagerPlugins(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSystemInfo", async () => {
    const result = await octoprintClient.getSystemInfo(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSystemCommands", async () => {
    const result = await octoprintClient.getSystemCommands(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSoftwareUpdateCheck", async () => {
    const result = await octoprintClient.getSoftwareUpdateCheck(auth, false);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getPluginPiSupport", async () => {
    const result = await octoprintClient.getPluginPiSupport(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on deleteTimeLapse", async () => {
    const result = await octoprintClient.deleteTimeLapse(auth, "deletedFile");
    expect(result).toBeUndefined();
  });

  it("should not throw error on listUnrenderedTimeLapses", async () => {
    const result = await octoprintClient.listUnrenderedTimeLapses(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on listProfiles", async () => {
    const result = await octoprintClient.listProfiles(auth);
    expect(result).toBeUndefined();
  });
});
