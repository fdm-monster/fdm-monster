import { DITokens } from "@/container.tokens";
import { setupTestApp } from "../../test-server";
import { AwilixContainer } from "awilix";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { CurrentUserDto } from "@/services/octoprint/dto/auth/current-user.dto";
import { OctoprintType } from "@/services/printer-api.interface";
import nock from "nock";

let octoprintClient: OctoprintClient;
let container: AwilixContainer;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  octoprintClient = container.resolve(DITokens.octoprintClient);
  await container.resolve(DITokens.settingsStore).loadSettings();
});

describe(OctoprintClient.name, () => {
  const apiKey = "surewhynotsurewhynotsurewhynotsu";
  const printerURL = "http://someurl/";
  const auth = { apiKey, printerURL, printerType: OctoprintType };

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
    const reply = {};
    nock(printerURL).get("/api/settings").reply(200, reply);

    const result = await octoprintClient.getSettings(auth);
    expect(result.data).toStrictEqual(reply);
  });

  it("should not throw error on getApiVersion", async () => {
    const reply = {
      api: "0.1",
      server: "1.10.2",
      text: "OctoPrint 1.10.2",
    };
    nock(printerURL).get("/api/version").reply(200, reply);

    const result = await octoprintClient.getApiVersion(auth);
    expect(result.data).toStrictEqual(reply);
  });

  it("should not throw error on getServer", async () => {
    const reply = {
      version: "1.10.2",
      safemode: "",
    };
    nock(printerURL).get("/api/server").reply(200, reply);

    const result = await octoprintClient.getServer(auth);
    expect(result.data).toStrictEqual(reply);
  });

  it("should not throw error on POST login", async () => {
    const reply = { session: "1234asd" };
    nock(printerURL).post("/api/login").query("passive=true").reply(200, reply);

    const result = await octoprintClient.login(auth);
    expect(result.data).toStrictEqual(reply);
  });

  it("should get first admin's username when response not recognized", async () => {
    nock(printerURL)
      .get("/api/currentuser")
      .reply(200, {
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
      } as CurrentUserDto);
    const adminResult = await octoprintClient.getAdminUserOrDefault(auth);
    expect(adminResult).toBe("rooter");
  });

  it("should pick admin user from keys", async () => {
    nock(printerURL).get("/api/currentuser").reply(200, require("../test-data/octoprint-users.response.json"));
    const adminResult = await octoprintClient.getAdminUserOrDefault(auth);
    expect(adminResult).toBeUndefined();
  });

  it("should not throw error on getUsers", async () => {
    nock(printerURL).get("/api/users").reply(200, require("../test-data/octoprint-users.response.json"));
    const usersResult = await octoprintClient.getUsers(auth);
    expect(usersResult).toBeTruthy();
  });

  it("should not throw error on getFiles", async () => {
    nock(printerURL).get("/api/files/local").query("recursive=false").reply(200, []);
    const filesResult = await octoprintClient.getLocalFiles(auth);
    expect(filesResult).toHaveLength(0);
  });

  it("should not throw error on getFile", async () => {
    const filename = "usr/path/illegal.gcode";
    nock(printerURL)
      .get("/api/files/local/" + filename)
      .reply(200, {});
    const fileResult = await octoprintClient.getFile(auth, filename);
    expect(fileResult).toBeTruthy();
  });

  it("should not throw error on sendJobCommand", async () => {
    nock(printerURL).post("/api/job").reply(200, {});
    const result = await octoprintClient.sendJobCommand(auth, { select: true });
    expect(result).toBeTruthy();
  });

  it("should not throw error on sendBedTempCommand", async () => {
    nock(printerURL).post("/api/printer/bed").reply(200, {});
    const result = await octoprintClient.sendBedTempCommand(auth, 50);
    expect(result).toBeTruthy();
  });

  it("should not throw error on setGCodeAnalysis", async () => {
    nock(printerURL).post("/api/settings").reply(200, {});
    const result = await octoprintClient.setGCodeAnalysis(auth, false);
    expect(result).toBeTruthy();
  });

  it("should not throw error on createFolder", async () => {
    nock(printerURL).post("/api/files/local").reply(200, {});
    const result = await octoprintClient.createFolder(auth, "newPath", "someFolder");
    expect(result).toBeTruthy();
  });

  it("should not throw error on moveFileOrFolder", async () => {
    const oldPath = "oldPath";
    nock(printerURL)
      .post("/api/files/local/" + oldPath)
      .reply(200, {});
    const result = await octoprintClient.moveFileOrFolder(auth, oldPath, "newPath");
    expect(result).toBeTruthy();
  });

  it("should not throw error on selectPrintFile", async () => {
    const printPath = "pathhere";
    nock(printerURL)
      .post("/api/files/local/" + printPath)
      .reply(200, {});
    const result = await octoprintClient.postSelectPrintFile(auth, printPath, true);
    expect(result).toBeUndefined();
  });

  it("should not throw error on deleteFileOrFolder", async () => {
    const printPath = "pathhere2";
    nock(printerURL)
      .delete("/api/files/local/" + printPath)
      .reply(200, {});
    const result = await octoprintClient.deleteFileOrFolder(auth, printPath);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getPrinterCurrent", async () => {
    nock(printerURL).get("/api/printer").query("history=false").reply(200, {});
    const result = await octoprintClient.getPrinterCurrent(auth, false);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getConnection", async () => {
    nock(printerURL).get("/api/connection").reply(200, {});
    const result = await octoprintClient.getConnection(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getPrinterProfiles", async () => {
    nock(printerURL).get("/api/printerprofiles").reply(200, {});
    const result = await octoprintClient.getPrinterProfiles(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getApiPluginManager", async () => {
    nock(printerURL).get("/plugin/pluginmanager/plugins").reply(200, {});
    const result = await octoprintClient.getPluginManagerPlugins(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getSystemInfo", async () => {
    nock(printerURL).get("/api/system/info").reply(200, {});
    const result = await octoprintClient.getSystemInfo(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getSystemCommands", async () => {
    nock(printerURL).get("/api/system/commands").reply(200, {});
    const result = await octoprintClient.getSystemCommands(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getSoftwareUpdateCheck", async () => {
    nock(printerURL).get("/plugin/softwareupdate/check").reply(200, {});
    const result = await octoprintClient.getSoftwareUpdateCheck(auth, false);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getPluginPiSupport", async () => {
    nock(printerURL).get("/api/plugin/pi_support").reply(200, {});
    const result = await octoprintClient.getPluginPiSupport(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on deleteTimeLapse", async () => {
    nock(printerURL).delete("/api/timelapse/deletedFile").reply(200, {});
    const result = await octoprintClient.deleteTimeLapse(auth, "deletedFile");
    expect(result).toBeTruthy();
  });

  it("should not throw error on listUnrenderedTimeLapses", async () => {
    nock(printerURL).get("/api/timelapse").query("unrendered=true").reply(200, {});
    const result = await octoprintClient.listUnrenderedTimeLapses(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on listProfiles", async () => {
    nock(printerURL).get("/api/plugin/printerprofiles").reply(200, {});
    const result = await octoprintClient.listProfiles(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getBackupOverview", async () => {
    nock(printerURL).get("/plugin/backup").reply(200, {});
    const result = await octoprintClient.getBackupOverview(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on getBackups", async () => {
    nock(printerURL).get("/plugin/backup/backup").reply(200, {});
    const result = await octoprintClient.getBackups(auth);
    expect(result).toBeTruthy();
  });

  it("should not throw error on createBackup", async () => {
    nock(printerURL).post("/plugin/backup/backup").reply(200, {});
    const result = await octoprintClient.createBackup(auth, []);
    expect(result).toBeTruthy();
  });

  it("should not throw error on deleteBackup", async () => {
    const file = "123.file";
    nock(printerURL)
      .delete("/plugin/backup/backup/" + file)
      .reply(200, {});
    const result = await octoprintClient.deleteBackup(auth, file);
    expect(result).toBeTruthy();
  });

  it("should not throw error on sendPrintHeadJogCommand", async () => {
    nock(printerURL).post("/api/printer/printhead").reply(200, {});
    const result = await octoprintClient.sendPrintHeadJogCommand(auth, { x: 1, y: 0, z: 0, speed: 1 });
    expect(result).toBeUndefined();
  });

  it("should not throw error on sendPrintHeadJogCommand", async () => {
    nock(printerURL).post("/api/printer/printhead").reply(200, {});
    const result = await octoprintClient.sendPrintHeadHomeCommand(auth, { x: true, y: false, z: false });
    expect(result).toBeUndefined();
  });
});
