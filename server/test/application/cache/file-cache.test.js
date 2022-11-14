const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const { getDefaultFileStatistics } = require("../../../constants/service.constants");

let container;
let fileCache;

beforeEach(() => {
  container = configureContainer();
  fileCache = container.resolve(DITokens.fileCache);
});

const testPrinterId = "asd";
const fileStorageEntry = {
  fileList: [1],
  storage: {},
};

describe("generate", function () {
  it("should generate printer file cache without strict checks", function () {
    const fileStorageEntryNoStorage = {
      fileList: [1],
    };
    fileCache.cachePrinterFileStorage(testPrinterId, fileStorageEntryNoStorage);
    expect(fileCache.getPrinterFiles(testPrinterId)).toEqual([1]);
    expect(fileCache.getPrinterStorage(testPrinterId)).toBeUndefined();

    fileCache.cachePrinterFileStorage(testPrinterId, fileStorageEntry);
    expect(fileCache.getPrinterFiles(testPrinterId)).toEqual([1]);
    expect(fileCache.getPrinterStorage(testPrinterId)).toEqual({});
  });
});
