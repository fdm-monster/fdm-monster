const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const dbHandler = require("../../db-handler");

let container;
let filesStore;
let printerFilesService;
let printersStore;

beforeEach(async () => {
  await dbHandler.connect();
  if (container) container.dispose();
  container = configureContainer();
  filesStore = container.resolve(DITokens.filesStore);
  printerFilesService = container.resolve(DITokens.printerFilesService);
  printersStore = container.resolve(DITokens.printersStore);
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("filesStore", () => {
  const validNewPrinter = {
    apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    webSocketURL: "ws://asd.com/",
    printerURL: "https://asd.com:81",
    camURL: "http://asd.com:81"
  };

  it("old files - should deal with empty files cache correctly", async () => {
    await printersStore.loadPrintersStore();
    let testPrinterState = await printersStore.addPrinter(validNewPrinter);
    await filesStore.loadFilesStore();

    const filesCache = filesStore.getFiles(testPrinterState.id);
    expect(filesCache.fileCount).toBe(0);

    const oldFiles = filesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(0);
  });

  it("old files - should keep new files correctly", async () => {
    await printersStore.loadPrintersStore();
    let testPrinterState = await printersStore.addPrinter(validNewPrinter);

    await printerFilesService.updateFiles(testPrinterState.id, {
      files: [{
        date: 1645611270597
      }]
    });
    await filesStore.loadFilesStore();

    const filesCache = filesStore.getFiles(frozenObject.id);
    expect(filesCache.fileCount).toBe(1);

    const oldFiles = filesStore.getOutdatedFiles(frozenObject.id, 7);
    expect(oldFiles.length).toBe(0);
  });

  it("old files - should filter old files correctly", async () => {
    await printersStore.loadPrintersStore();
    let testPrinterState = await printersStore.addPrinter(validNewPrinter);

    await printerFilesService.updateFiles(testPrinterState.id, {
      files: [{
        date: 1645611270597
      }, {
        date: 1642929348000
      }]
    });
    await filesStore.loadFilesStore();

    const filesCache = filesStore.getFiles(testPrinterState.id);
    expect(filesCache.files.length).toBe(2);

    const oldFiles = filesStore.getOutdatedFiles(testPrinterState.id, 7);
    expect(oldFiles.length).toBe(1);
  });
});
