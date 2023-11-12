import { validNewPrinterState } from "../test-data/printer.data";
import { PrinterService } from "@/services/printer.service";
import { PrinterCache } from "@/state/printer.cache";
import { FilesStore } from "@/state/files.store";
import { AwilixContainer } from "awilix";
jest.mock("../../../src/services/octoprint/octoprint-api.service");
import { connect, closeDatabase } from "../../db-handler";
import { DITokens } from "@/container.tokens";
import { configureContainer } from "@/container";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { TestPrinterSocketStore } from "@/state/test-printer-socket.store";

let container: AwilixContainer;
let printerService: PrinterService;
let printerCache: PrinterCache;
let testPrinterSocketStore: TestPrinterSocketStore;
let filesStore: FilesStore;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  await container.resolve(DITokens.settingsStore).loadSettings();
  testPrinterSocketStore = container.resolve(DITokens.testPrinterSocketStore);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  filesStore = container.resolve(DITokens.filesStore);
  await printerCache.loadCache();
});

afterAll(async () => {
  await closeDatabase();
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
    let printerEntity = await printerService.create(validNewPrinterState);
    expect(printerEntity).toBeTruthy();

    // Need the store in order to have files to refer to
    await filesStore.loadFilesStore();

    const printerDto = await printerCache.getCachedPrinterOrThrowAsync(printerEntity.id);
    expect(printerDto).toMatchObject({
      id: expect.anything(),
    });
  });

  it("should load cache with a saved printer", async () => {
    await printerService.create(validNewPrinterState);
    await printerCache.loadCache();

    expect((await printerCache.listCachedPrinters()).length).toBeGreaterThan(0);
  });

  it("should get undefined test printer from store", async () => {
    expect(testPrinterSocketStore.testSocket).toBeUndefined();
  });
});
