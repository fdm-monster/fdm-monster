jest.mock("../../../services/octoprint/octoprint-api.service");
const dbHandler = require("../../db-handler");
const { DITokens } = require("../../../container.tokens");
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
    printerURL: null,
  };

  const weakNewPrinter = {
    apiKey: "asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd",
    printerURL: "http://192.168.1.0",
  };

  const weakNewPrinter2 = {
    apiKey: "1C0KVOKWEAKWEAK8VBGAR",
    printerURL: "http://192.168.1.0",
  };

  it("should avoid adding invalid printer", async () => {
    await expect(async () => await printerService.create({})).rejects.toBeInstanceOf(ValidationException);

    expect(() => printerService.create(invalidNewPrinterState)).rejects.toHaveErrors({
      apiKey: {
        rule: "length",
      },
    });

    await expect(async () => await printerService.create(weakNewPrinter)).rejects.toBeInstanceOf(ValidationException);

    await expect(async () => await printerService.create(weakNewPrinter2)).rejects.toBeDefined();
  });

  it("should be able to add and flatten new printer", async () => {
    let frozenObject = await printerService.create(validNewPrinterState);
    const printerDto = printerCache.getCachedPrinterOrThrowAsync(frozenObject.id);
    expect(printerDto).toBeTruthy();
  });

  it("should be able to add printer - receiving an object back", async () => {
    let printerDoc = await printerService.create(validNewPrinterState);
    expect(printerDoc).toBeTruthy();

    // Need the store in order to have files to refer to
    await filesStore.loadFilesStore();

    const printerDto = await printerCache.getCachedPrinterOrThrowAsync(printerDoc.id);
    expect(printerDto).toMatchObject({
      id: expect.any(String),
    });
  });

  it("should load cache with a saved printer", async () => {
    await printerService.create(validNewPrinterState);
    await printerCache.loadCache();

    expect((await printerCache.listCachedPrinters()).length).toBeGreaterThan(0);
  });

  // TODO move to PrinterService tests
  it("should update api user from PrinterService", async () => {
    const newApiUserName = "testname";
    const newPrinter = await printerService.create(validNewPrinterState);
    const result = await printerService.updateApiUsername(newPrinter.id, newApiUserName);
    // Should not return currentUser
    expect(result.currentUser).toEqual(newApiUserName);
  });

  it("should get undefined test printer from store", async () => {
    expect(printerSocketStore.testSocket).toBeUndefined();
  });
});
