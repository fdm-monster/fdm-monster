import { beforeEach, describe, expect, it } from "@jest/globals";
import { FileCache } from "@/state/file.cache";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";

let container;
let fileCache: FileCache;

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
