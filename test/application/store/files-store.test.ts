import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterFilesService } from "@/services/printer-files.service";
import { AwilixContainer } from "awilix";
import { connect } from "../../db-handler";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { PrinterService } from "@/services/printer.service";

let container: AwilixContainer;
let printerFilesStore: PrinterFilesStore;
let printerFilesService: PrinterFilesService;
let printerService: PrinterService;
let printerCache: PrinterCache;

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  container = configureContainer();
  printerFilesStore = container.resolve(DITokens.printerFilesStore);
  printerFilesService = container.resolve(DITokens.printerFilesService);
  printerService = container.resolve(DITokens.printerService);
  printerCache = container.resolve(DITokens.printerCache);
});

describe(PrinterFilesStore.name, () => {
  const validNewPrinter = {
    apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    printerURL: "https://asd.com:81",
    name: "FileTestPrinter",
  };

  it("old files - should deal with empty files cache correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);
    await printerFilesStore.loadFilesStore();

    const filesCache = printerFilesStore.getFiles(testPrinterState.id);
    expect(filesCache.length).toBe(0);

    const oldFiles = printerFilesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(0);
  });

  it("old files - should keep new files correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);
    await printerFilesService.updateFiles(testPrinterState.id, [
      {
        date: Date.now() / 1000,
      },
    ]);
    await printerFilesStore.loadFilesStore();

    const filesCache = printerFilesStore.getFiles(testPrinterState.id);
    expect(filesCache.length).toBe(1);

    const oldFiles = printerFilesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(0);
    await printerFilesService.updateFiles(testPrinterState.id, []);
  });

  it("old files - should filter old files correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);

    await printerFilesService.updateFiles(testPrinterState.id, [
      {
        date: Date.now() / 1000,
      },
      {
        date: Date.now() / 1000 - 8 * 86400,
      },
    ]);
    await printerFilesStore.loadFilesStore();

    const filesCache = printerFilesStore.getFiles(testPrinterState.id);
    expect(filesCache.length).toBe(2);

    const oldFiles = printerFilesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(1);
  });
});
