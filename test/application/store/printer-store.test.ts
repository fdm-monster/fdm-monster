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
import { OctoprintType, BambuType } from "@/services/printer-api.interface";

jest.mock("@/services/octoprint/octoprint.client");

let printerService: IPrinterService;
let printerCache: PrinterCache;
let testPrinterSocketStore: TestPrinterSocketStore;
let printerFilesStore: PrinterFilesStore;
let printerSocketStore: PrinterSocketStore;

beforeAll(async () => {
  const container = configureContainer();
  await container.resolve<TypeormService>(DITokens.typeormService).createConnection();
  await container.resolve(DITokens.settingsStore).loadSettings();
  testPrinterSocketStore = container.resolve(DITokens.testPrinterSocketStore);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  printerFilesStore = container.resolve(DITokens.printerFilesStore);
  printerSocketStore = container.resolve(DITokens.printerSocketStore);
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
            expected: "0 | 1 | 2 | 3",
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

  it("should create a new socket adapter when printer type changes", async () => {
    // Arrange - Create a printer with OctoPrint type
    const printerEntity = await printerService.create({
      ...validNewPrinterState,
      printerType: OctoprintType,
      name: "TestPrinter_TypeChange",
    });

    // Get initial socket adapter
    const initialAdapter = printerSocketStore.getPrinterSocket(printerEntity.id);
    expect(initialAdapter).toBeDefined();
    expect(initialAdapter?.printerType).toBe(OctoprintType);

    // Act - Update printer to Bambu type
    await printerService.update(printerEntity.id, {
      ...validNewPrinterState,
      printerType: BambuType,
      username: "test_serial",
      password: "test_code",
    });

    // Assert - New socket adapter should be created
    const newAdapter = printerSocketStore.getPrinterSocket(printerEntity.id);
    expect(newAdapter).toBeDefined();
    expect(newAdapter?.printerType).toBe(BambuType);
    expect(newAdapter).not.toBe(initialAdapter); // Different adapter instance
  });

  it("should properly dispose of old adapter resources when printer type changes", async () => {
    // Arrange - Create a printer with OctoPrint type
    const printerEntity = await printerService.create({
      ...validNewPrinterState,
      printerType: OctoprintType,
      name: "TestPrinter_ResourceCleanup",
    });

    const initialAdapter = printerSocketStore.getPrinterSocket(printerEntity.id) as any;
    expect(initialAdapter).toBeDefined();
    expect(initialAdapter.printerType).toBe(OctoprintType);

    // Spy on the close method to verify it's called
    const closeSpy = jest.spyOn(initialAdapter, "close");

    // Act - Update printer to different type
    await printerService.update(printerEntity.id, {
      ...validNewPrinterState,
      printerType: BambuType,
      username: "test_serial",
      password: "test_code",
    });

    // Assert - Old adapter's close method was called
    expect(closeSpy).toHaveBeenCalled();

    // Verify new adapter is different type and different instance
    const newAdapter = printerSocketStore.getPrinterSocket(printerEntity.id);
    expect(newAdapter).toBeDefined();
    expect(newAdapter?.printerType).toBe(BambuType);
    expect(newAdapter).not.toBe(initialAdapter); // Different adapter instance
  });

  it("should stop old adapter intervals when printer type changes from OctoPrint", async () => {
    // Arrange - Create an OctoPrint printer
    const printerEntity = await printerService.create({
      ...validNewPrinterState,
      printerType: OctoprintType,
      name: "TestPrinter_IntervalCleanup",
    });

    const initialAdapter = printerSocketStore.getPrinterSocket(printerEntity.id) as any;
    expect(initialAdapter).toBeDefined();
    expect(initialAdapter.printerType).toBe(OctoprintType);

    // Manually set an interval to simulate the adapter having running timers
    const mockIntervalId = setInterval(() => {}, 1000);
    initialAdapter.refreshPrinterCurrentInterval = mockIntervalId;

    // Spy on clearInterval to verify it's called
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    // Act - Update printer to different type
    await printerService.update(printerEntity.id, {
      ...validNewPrinterState,
      printerType: BambuType,
      username: "test_serial",
      password: "test_code",
    });

    // Assert - clearInterval was called with the mock interval ID
    expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId);

    // Verify new adapter is different type
    const newAdapter = printerSocketStore.getPrinterSocket(printerEntity.id);
    expect(newAdapter?.printerType).toBe(BambuType);

    clearIntervalSpy.mockRestore();
    // Clean up any remaining interval
    clearInterval(mockIntervalId);
  });

  it("should clean up pending RPC requests when adapter is closed", async () => {
    // This test verifies that our WebsocketRpcExtendedAdapter cleanup works
    // Create a mock WebsocketRpcExtendedAdapter to test the cleanup behavior

    // Arrange - Create an adapter with pending requests
    const mockAdapter = {
      requestMap: new Map(),
      clearAllRequests: function() {
        for (const [, request] of this.requestMap.entries()) {
          clearTimeout(request.timeout);
          request.reject(new Error("WebSocket adapter closed"));
        }
        this.requestMap.clear();
      },
      close: function() {
        this.clearAllRequests();
      }
    };

    // Add some mock pending requests
    const mockTimeout1 = setTimeout(() => {}, 5000);
    const mockTimeout2 = setTimeout(() => {}, 5000);
    const mockReject1 = jest.fn();
    const mockReject2 = jest.fn();

    mockAdapter.requestMap.set(1, { resolve: jest.fn(), reject: mockReject1, timeout: mockTimeout1 });
    mockAdapter.requestMap.set(2, { resolve: jest.fn(), reject: mockReject2, timeout: mockTimeout2 });

    // Spy on clearTimeout
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    // Act - Close the adapter (this should trigger cleanup)
    mockAdapter.close();

    // Assert - All timeouts were cleared and requests rejected
    expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimeout1);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimeout2);
    expect(mockReject1).toHaveBeenCalledWith(new Error("WebSocket adapter closed"));
    expect(mockReject2).toHaveBeenCalledWith(new Error("WebSocket adapter closed"));
    expect(mockAdapter.requestMap.size).toBe(0);

    clearTimeoutSpy.mockRestore();
    // Clean up any remaining timeouts
    clearTimeout(mockTimeout1);
    clearTimeout(mockTimeout2);
  });
});
