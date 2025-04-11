import { validNewPrinterState } from "../test-data/printer.data";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { DITokens } from "@/container.tokens";
import { configureContainer } from "@/container";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { TestPrinterSocketStore } from "@/state/test-printer-socket.store";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { z, ZodError } from "zod";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { createPrinterSchema } from "@/services/validators/printer-service.validation";

jest.mock("@/services/octoprint/octoprint.client");

let printerService: IPrinterService;
let printerCache: PrinterCache;
let testPrinterSocketStore: TestPrinterSocketStore;
let printerFilesStore: PrinterFilesStore;

beforeAll(async () => {
  const container = configureContainer(true);
  expect(container.resolve(DITokens.isTypeormMode)).toBe(true);
  await container.resolve<TypeormService>(DITokens.typeormService).createConnection();
  await container.resolve(DITokens.settingsStore).loadSettings();
  testPrinterSocketStore = container.resolve(DITokens.testPrinterSocketStore);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  printerFilesStore = container.resolve(DITokens.printerFilesStore);
  await printerCache.loadCache();
});

describe(PrinterSocketStore.name, () => {
  const invalidNewPrinterState = {
    apiKey: "asd",
    printerURL: null as null | string,
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
    await expect(() => printerService.create({} as z.infer<typeof createPrinterSchema>)).rejects.toBeInstanceOf(
      ValidationException,
    );
    await expect(() =>
      printerService.create(invalidNewPrinterState as z.infer<typeof createPrinterSchema>),
    ).rejects.toBeInstanceOf(ValidationException<ZodError>);
    await expect(() =>
      printerService.create(invalidNewPrinterState as z.infer<typeof createPrinterSchema>),
    ).rejects.toMatchObject({
      name: "ValidationException",
      errors: expect.objectContaining({
        issues: expect.arrayContaining([
          {
            code: "invalid_type",
            expected: "string",
            received: "null",
            path: ["printerURL"],
            message: "Expected string, received null",
          },
          {
            code: "invalid_type",
            expected: "number",
            received: "undefined",
            path: ["printerType"],
            message: "Required",
          },
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["name"],
            message: "Required",
          },
        ]),
      }),
    });

    await expect(
      async () => await printerService.create(weakNewPrinter as z.infer<typeof createPrinterSchema>),
    ).rejects.toBeInstanceOf(ValidationException);

    await expect(
      async () => await printerService.create(weakNewPrinter2 as z.infer<typeof createPrinterSchema>),
    ).rejects.toBeDefined();
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
    await printerFilesStore.loadFilesStore();

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
