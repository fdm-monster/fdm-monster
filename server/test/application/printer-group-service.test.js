const printerGroupModel = require("../../models/PrinterGroup");
const dbHandler = require("../db-handler");
const DITokens = require("../../container.tokens");
const { configureContainer } = require("../../container");
const { PrinterGroupMockData } = require("./test-data/printer-group.data");

let printerService;
let printerGroupService;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  printerService = container.resolve(DITokens.printerService);
  printerGroupService = container.resolve(DITokens.printerGroupService);
});
afterEach(async () => {
  await dbHandler.clearDatabase();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

/**
 * PrinterGroupService test suite.
 */
describe("PrinterGroupService ", () => {
  /**
   * Tests that a valid printer group can be created through the printerGrouoService without throwing any errors.
   */
  it("can be created correctly with printer", async () => {
    // Seed with a mock Printer DTO
    const newPrinterData = PrinterGroupMockData.PrinterMock;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();

    // Prepare the CRUD DTO
    const newPrinterGroup = PrinterGroupMockData.PrinterGroupMock;
    newPrinterGroup.printers.push({
      location: "top right something",
      printerId: createdPrinter._id,
    });

    // Create it
    await printerGroupService.create(newPrinterGroup);

    // Assert creation
    const createdPrinterGroup = await printerGroupModel.findOne();
    expect(createdPrinterGroup).toBeTruthy();
  });
});
