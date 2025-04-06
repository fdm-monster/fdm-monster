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

const testPrinterId = "asd";
const fakeFileList: FileDto[] = [{ path: "asd", size: 1, date: Date.now() }];

describe(FileCache.name, function () {
  it("should generate printer file cache", function () {
    fileCache.cachePrinterFiles(testPrinterId, fakeFileList);
    expect(fileCache.getPrinterFiles(testPrinterId)).toEqual([{ path: "asd" }]);
  });
});
