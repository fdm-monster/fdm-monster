const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const { Printer } = require("../../models/Printer");
const { DITokens } = require("../../container.tokens");
const { testPrinterData } = require("./test-data/printer.data");

let container;
let printerService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  printerService = container.resolve(DITokens.printerService);
});

afterAll(async () => {
  return Printer.deleteMany({});
});

describe("PrinterService", () => {
  it("Must be able to rename a created printer", async () => {
    const printer = await printerService.create(testPrinterData);
    const updatedName = "newName";
    const printerUpdate = {
      ...testPrinterData,
      settingsAppearance: {
        name: updatedName,
      },
    };

    await printerService.update(printer.id, printerUpdate);
    const foundPrinter = await Printer.findOne({ id: printer.id });
    expect(foundPrinter.settingsAppearance.name).toEqual(updatedName);
  });
});
