import { FileCache } from "@/state/file.cache";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";

let container: AwilixContainer;
let fileCache: FileCache;

beforeEach(() => {
  container = configureContainer();
  fileCache = container.resolve(DITokens.fileCache);
});

const testPrinterId = "asd";
const fileStorageEntry = [{ id: "1", name: "123" }];

describe(FileCache.name, function () {
  it("should generate printer file cache", function () {
    fileCache.cachePrinterFiles(testPrinterId, fileStorageEntry);
    expect(fileCache.getPrinterFiles(testPrinterId)).toStrictEqual(fileStorageEntry);
  });
});
