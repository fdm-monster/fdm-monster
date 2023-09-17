import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { AxiosMock } from "../../mocks/axios.mock";
import { asClass } from "awilix";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { connect, clearDatabase, closeDatabase } from "../../db-handler";

let octoPrintApi: OctoPrintApiService;
let httpClient: AxiosMock;

beforeAll(async () => {
  await connect();
  const container = configureContainer();
  container.register(DITokens.httpClient, asClass(AxiosMock).singleton());
  await container.resolve(DITokens.settingsStore).loadSettings();

  httpClient = container.resolve(DITokens.httpClient);
  octoPrintApi = container.resolve(DITokens.octoPrintApiService);
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("OctoPrint-API-Client-Service", () => {
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
        await octoPrintApi.getSettings({
          apiKey: "surewhynot",
          printerURL: "some uwrl",
        })
    ).rejects.toHaveProperty("code", "ERR_INVALID_URL");
  });

  it("should not throw error on getSettings with correct printerURL", async () => {
    const settings = await octoPrintApi.getSettings(auth);
  });

  it("should get first admin's username when response not recognized", async () => {
    httpClient.saveMockResponse([], 200);
    const adminResult = await octoPrintApi.getAdminUserOrDefault(auth);
    expect(adminResult).toBe("admin");
  });

  it("should pick admin user from keys", async () => {
    const usersResponse = require("../test-data/octoprint-users.response.json");
    httpClient.saveMockResponse(usersResponse, 200);
    const adminResult = await octoPrintApi.getAdminUserOrDefault(auth);
    expect(adminResult).toBe("root");
  });

  it("should not throw error on getUsers", async () => {
    const usersResult = await octoPrintApi.getUsers(auth);
    expect(usersResult).toBeUndefined();
  });

  it("should not throw error on getFiles", async () => {
    const filesResult = await octoPrintApi.getFiles(auth);
    expect(filesResult).toBeUndefined();
  });

  it("should not throw error on getFile", async () => {
    const fileResult = await octoPrintApi.getFile(auth, "usr/path/illegal.gcode");
    expect(fileResult).toBeUndefined();
  });

  it("should not throw error on sendJobCommand", async () => {
    const result = await octoPrintApi.sendJobCommand(auth, { select: true });
    expect(result).toBeUndefined();
  });

  it("should not throw error on sendBedTempCommand", async () => {
    const result = await octoPrintApi.sendBedTempCommand(auth, 50);
    expect(result).toBeUndefined();
  });

  it("should not throw error on setGCodeAnalysis", async () => {
    const result = await octoPrintApi.setGCodeAnalysis(auth, { enabled: false });
    expect(result).toBeUndefined();
  });

  it("should not throw error on createFolder", async () => {
    const result = await octoPrintApi.createFolder(auth, "newPath", "someFolder");
    expect(result).toBeUndefined();
  });

  it("should not throw error on moveFileOrFolder", async () => {
    const result = await octoPrintApi.moveFileOrFolder(auth, "oldPath", "newPath");
    expect(result).toBeUndefined();
  });

  it("should not throw error on selectPrintFile", async () => {
    const result = await octoPrintApi.selectPrintFile(auth, "path", true);
    expect(result).toBeUndefined();
  });

  it("should not throw error on deleteFileOrFolder", async () => {
    const result = await octoPrintApi.deleteFileOrFolder(auth, "path");
    expect(result).toBeUndefined();
  });

  it("should not throw error on getConnection", async () => {
    const result = await octoPrintApi.getConnection(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getPrinterProfiles", async () => {
    const result = await octoPrintApi.getPrinterProfiles(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getApiPluginManager", async () => {
    const result = await octoPrintApi.getPluginManagerPlugins(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSystemInfo", async () => {
    const result = await octoPrintApi.getSystemInfo(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSystemCommands", async () => {
    const result = await octoPrintApi.getSystemCommands(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getSoftwareUpdateCheck", async () => {
    const result = await octoPrintApi.getSoftwareUpdateCheck(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on getPluginPiSupport", async () => {
    const result = await octoPrintApi.getPluginPiSupport(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on deleteTimeLapse", async () => {
    const result = await octoPrintApi.deleteTimeLapse(auth, "deletedFile");
    expect(result).toBeUndefined();
  });

  it("should not throw error on listUnrenderedTimeLapses", async () => {
    const result = await octoPrintApi.listUnrenderedTimeLapses(auth);
    expect(result).toBeUndefined();
  });

  it("should not throw error on listProfiles", async () => {
    const result = await octoPrintApi.listProfiles(auth);
    expect(result).toBeUndefined();
  });
});
