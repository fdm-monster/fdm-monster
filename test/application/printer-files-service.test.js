const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const { Printer } = require("../../models/Printer");
const { DITokens } = require("../../container.tokens");
const { testPrinterData } = require("./test-data/printer.data");

let container;
/**
 * @type {PrinterService}
 */
let printerService;
/**
 * @type {PrinterFilesService}
 */
let printerFilesService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  printerService = container.resolve(DITokens.printerService);
  printerFilesService = container.resolve(DITokens.printerFilesService);
});

afterAll(async () => {
  return Printer.deleteMany({});
});

describe("PrinterFileService", () => {
  it("should list printer files", async () => {
    const printer = await printerService.create(testPrinterData);

    const files = await printerFilesService.getPrinterFilesStorage(printer._id);
    expect(files.fileList.files).toEqual([]);
  });
});
