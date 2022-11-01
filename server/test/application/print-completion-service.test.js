const printerGroupModel = require("../../models/PrinterGroup");
const dbHandler = require("../db-handler");
const DITokens = require("../../container.tokens");
const { configureContainer } = require("../../container");
const { PrinterGroupMockData } = require("./test-data/printer-group.data");
const { PrintCompletionService } = require("../../services/print-completion.service");

let printCompletionService;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  printCompletionService = container.resolve(DITokens.printCompletionService);
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
describe(PrintCompletionService.name, () => {
  /**
   * Tests that a valid printer group can be created through the printerGrouoService without throwing any errors.
   */
  it("can add a print failure with or without log", async () => {
    const completionEntry = await printCompletionService.create({
      printerId: "5f14968b11034c4ca49e7c69",
      completionLog: "some log happened here",
      status: "failed",
      fileName: "mycode.gcode",
    });
    expect(completionEntry._id).toBeTruthy();

    const completionEntryWithoutLog = await printCompletionService.create({
      printerId: "5f14968b11034c4ca49e7c69",
      status: "failed",
      fileName: "mycode.gcode",
    });
    expect(completionEntryWithoutLog._id).toBeTruthy();
  });
});
