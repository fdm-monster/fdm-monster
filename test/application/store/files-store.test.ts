import { DITokens } from "@/container.tokens";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { setupTestApp } from "../../test-server";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { MoonrakerType, PrinterType } from "@/services/printer-api.interface";

let printerFilesStore: PrinterFilesStore;
let printerService: IPrinterService;
let printerCache: PrinterCache;

beforeEach(async () => {
  const { container } = await setupTestApp(true);
  printerFilesStore = container.resolve(DITokens.printerFilesStore);
  printerService = container.resolve(DITokens.printerService);
  printerCache = container.resolve(DITokens.printerCache);
});

describe(PrinterFilesStore.name, () => {
  const validNewPrinter = {
    apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    printerURL: "https://asd.com:81",
    name: "TestPrinter",
    printerType: MoonrakerType as PrinterType,
  };

  it("old files - should deal with empty files cache correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);
    await printerFilesStore.loadFilesStore();

    // Now fake empty file list
    printerFilesStore.fileCache.cachePrinterFiles(testPrinterState.id, []);

    const filesCache = printerFilesStore.getFiles(testPrinterState.id);
    expect(filesCache?.length).toBe(0);

    const oldFiles = printerFilesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(0);
  });

  it("old files - should keep new files correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);
    printerFilesStore.fileCache.cachePrinterFiles(testPrinterState.id, [
      {
        date: Date.now() / 1000,
        path: "file.gcode",
        size: 10,
      },
    ]);

    const filesCache = printerFilesStore.getFiles(testPrinterState.id);
    expect(filesCache?.length).toBe(1);

    const oldFiles = printerFilesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(0);
  });

  it("old files - should filter old files correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);

    printerFilesStore.fileCache.cachePrinterFiles(testPrinterState.id, [
      {
        date: Date.now() / 1000,
        path: "file.gcode",
        size: 10,
      },
      {
        date: Date.now() / 1000 - 8 * 86400,
        path: "file2.gcode",
        size: 10,
      },
    ]);

    const filesCache = printerFilesStore.getFiles(testPrinterState.id);
    expect(filesCache?.length).toBe(2);

    const oldFiles = printerFilesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(1);
  });
});
