import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterFilesService } from "@/services/printer-files.service";
import { FilesStore } from "@/state/files.store";
import { AwilixContainer } from "awilix";
import { closeDatabase, connect } from "../../db-handler";
import { PrinterService } from "@/services/printer.service";

let container: AwilixContainer;
let filesStore: FilesStore;
let printerFilesService: PrinterFilesService;
let printerService: PrinterService;
let printerCache: PrinterCache;

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  if (container) await container.dispose();
  container = configureContainer();
  filesStore = container.resolve(DITokens.filesStore);
  printerFilesService = container.resolve(DITokens.printerFilesService);
  printerService = container.resolve(DITokens.printerService);
  printerCache = container.resolve(DITokens.printerCache);
});

afterAll(async () => {
  await closeDatabase();
});

describe(FilesStore.name, () => {
  const validNewPrinter = {
    apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    printerURL: "https://asd.com:81",
    name: "FileTestPrinter",
  };

  it("old files - should deal with empty files cache correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);
    await filesStore.loadFilesStore();

    const filesCache = filesStore.getFiles(testPrinterState.id);
    expect(filesCache.files.length).toBe(0);

    const oldFiles = filesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(0);
  });

  it("old files - should keep new files correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);
    await printerFilesService.updateFiles(testPrinterState.id, {
      files: [
        {
          date: Date.now() / 1000,
        },
      ],
    });
    await filesStore.loadFilesStore();

    const filesCache = filesStore.getFiles(testPrinterState.id);
    expect(filesCache.files.length).toBe(1);

    const oldFiles = filesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(0);
    await printerFilesService.updateFiles(testPrinterState.id, {
      files: [],
    });
  });

  it("old files - should filter old files correctly", async () => {
    await printerCache.loadCache();
    let testPrinterState = await printerService.create(validNewPrinter);

    await printerFilesService.updateFiles(testPrinterState.id, {
      files: [
        {
          date: Date.now() / 1000,
        },
        {
          date: Date.now() / 1000 - 8 * 86400,
        },
      ],
    });
    await filesStore.loadFilesStore();

    const filesCache = filesStore.getFiles(testPrinterState.id);
    expect(filesCache.files.length).toBe(2);

    const oldFiles = filesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(1);
  });
});
