jest.mock("../../../services/octoprint/octoprint-api.service");
const dbHandler = require("../../db-handler");
const DITokens = require("../../../container.tokens");
const { configureContainer } = require("../../../container");
const { ValidationException } = require("../../../exceptions/runtime.exceptions");
const { validNewPrinterState } = require("../test-data/printer.data");

let container;
/**
 * @type {PrinterService}
 */
let printerService;
/**
 * @type {PrinterCache}
 */
let printerCache;
let printerSocketStore;
let filesStore;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  await container.resolve(DITokens.settingsStore).loadSettings();

  printerSocketStore = container.resolve(DITokens.printerSocketStore);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  filesStore = container.resolve(DITokens.filesStore);
  await printerCache.loadCache();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("PrinterSocketStore", () => {
  const invalidNewPrinterState = {
    apiKey: "asd",
    webSocketURL: null,
    printerURL: null,
  };

  const weakNewPrinter = {
    apiKey: "asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd",
    webSocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0",
  };

  const weakNewPrinter2 = {
    apiKey: "1C0KVOKWEAKWEAK8VBGAR",
    webSocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0",
  };

  it("should avoid adding invalid printer", async () => {
    await expect(async () => await printerService.create({})).rejects.toBeInstanceOf(ValidationException);

    expect(() => printerService.create(invalidNewPrinterState)).rejects.toHaveErrors({
      apiKey: {
        rule: "length",
      },
      webSocketURL: {
        rule: "required",
      },
    });

    await expect(async () => await printerService.create(weakNewPrinter)).rejects.toBeInstanceOf(ValidationException);

    await expect(async () => await printerService.create(weakNewPrinter2)).rejects.toBeDefined();
  });

  it("should be able to add and flatten new printer", async () => {
    let frozenObject = await printerService.create(validNewPrinterState);
    const printerDto = printerCache.getCachedPrinter(frozenObject.id);
    expect(printerDto).toBeTruthy();
  });

  it("should be able to add printer - receiving an object back", async () => {
    let printerDoc = await printerService.create(validNewPrinterState);
    expect(printerDoc).toBeTruthy();

    // Need the store in order to have files to refer to
    await filesStore.loadFilesStore();

    const printerDto = printerCache.getCachedPrinter(printerDoc.id);
    expect(printerDto).toMatchObject({
      id: expect.any(String),
    });
  });

  it("should load cache with a saved printer", async () => {
    await printerService.create(validNewPrinterState);
    await printerCache.loadCache();

    expect(printerCache.listCachedPrinters().length).toBeGreaterThan(0);
  });

  // TODO move to PrinterService tests
  it("should update api user from PrinterService", async () => {
    const newApiUserName = "testname";
    const newPrinter = await printerService.create(validNewPrinterState);
    const result = await printerService.updateApiUsername(newPrinter.id, newApiUserName);
    // Should not return currentUser
    expect(result.currentUser).toEqual(newApiUserName);
  });

  it("should skip teardown test printer when already undefined", async () => {
    await printerSocketStore.deleteTestPrinter();
  });

  it("should get undefined test printer from store", async () => {
    expect(printerSocketStore.getTestPrinter()).toBeUndefined();
  });

  // it("should get whether printerState is authed", async () => {
  //   let printerState = await printerService.create(validNewPrinterState);
  //
  //   expect(printerState.isAdapterAuthed()).toBeFalsy();
  // });
  //
  // it("should get printerState apiAccessibility", async () => {
  //   let printerState = await printerService.create(validNewPrinterState);
  //   expect(printerState.getApiAccessibility()).toMatchObject({
  //     accessible: true,
  //     retryable: true,
  //     reason: null,
  //   });
  // });

  // it("should get printerState api accessible and retryable", async () => {
  //   let printerState = await printerService.create(validNewPrinterState);
  //   expect(printerState.isApiAccessible()).toBeTruthy();
  //   expect(printerState.isApiRetryable()).toBeTruthy();
  //   expect(printerState.shouldRetryConnect()).toBeTruthy();
  // });
  //
  // it("should get printerState octoprint undefined stored version when disconnected", async () => {
  //   let printerState = await printerService.create(validNewPrinterState);
  //   expect(printerState.getOctoPrintVersion()).toBeUndefined();
  // });

  // it("should get printerState url", async () => {
  //   let printerState = await printerService.create(validNewPrinterState);
  //   expect(printerState.getURL()).toBeTruthy();
  // });
  //
  // it("should get printerState url", async () => {
  //   let printerState = await printerService.create(validNewPrinterState);
  //   expect(printerState.getStateCategory()).toEqual(CATEGORY.Offline);
  // });
  //
  // it("should update printerState systemInfo", async () => {
  //   let printerState = await printerService.create(validNewPrinterState);
  //   expect(printerState.updateSystemInfo({})).toBeUndefined();
  // });
});
