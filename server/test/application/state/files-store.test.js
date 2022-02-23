const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const dbHandler = require("../../db-handler");

let container;
let filesStore;
let printersStore;

beforeEach(async () => {
  await dbHandler.connect();
  if (container) container.dispose();
  container = configureContainer();
  filesStore = container.resolve(DITokens.filesStore);
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

  it("should filter old files correctly", async () => {
    await printersStore.loadPrintersStore();
    let frozenObject = await printersStore.addPrinter(validNewPrinter);
    await filesStore.loadFilesStore();

    const filesCache = filesStore.getFiles(frozenObject.id);
    expect(filesCache.fileCount).toBe(0);

    const oldFiles = filesStore.getOutdatedFiles(frozenObject.id, 7);
    expect(oldFiles.length).toBe(0);
  });
});
