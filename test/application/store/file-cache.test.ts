import { FileCache } from "@/state/file.cache";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";
import { FileDto } from "@/services/printer-api.interface";

let container: AwilixContainer;
let fileCache: FileCache;

beforeEach(() => {
  container = configureContainer();
  fileCache = container.resolve(DITokens.fileCache);
});

const testPrinterId = 1;
const fileEntry = { path: "asd", size: 1, date: Date.now() } as FileDto;
const fakeFileList = [fileEntry];

describe(FileCache.name, function () {
  it("should generate printer file cache", function () {
    fileCache.cachePrinterFiles(testPrinterId, fakeFileList);
    expect(fileCache.getPrinterFiles(testPrinterId)).toEqual([fileEntry]);
  });
});
