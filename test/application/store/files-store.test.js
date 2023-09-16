const { configureContainer } = require("../../../container");
const { DITokens } = require("../../../container.tokens");
const dbHandler = require("../../db-handler");

let container;
let filesStore;
let printerFilesService;
/**
 * @type {PrinterService}
 */
let printerService;
let printerCache;

beforeAll(async () => {
  await dbHandler.connect();
});

beforeEach(async () => {
  if (container) container.dispose();
  container = configureContainer();
  filesStore = container.resolve(DITokens.filesStore);
  printerFilesService = container.resolve(DITokens.printerFilesService);
  printerService = container.resolve(DITokens.printerService);
  printerCache = container.resolve(DITokens.printerCache);
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("FilesStore", () => {
  const validNewPrinter = {
    apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    printerURL: "https://asd.com:81",
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
