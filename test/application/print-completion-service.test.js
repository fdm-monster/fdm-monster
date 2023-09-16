const dbHandler = require("../db-handler");
const { DITokens } = require("../../container.tokens");
const { configureContainer } = require("../../container");
const { PrintCompletionService } = require("../../services/print-completion.service");
const { EVENT_TYPES } = require("../../services/octoprint/constants/octoprint-websocket.constants");

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

describe(PrintCompletionService.name, () => {
  /**
   * Tests that a valid printer group can be created through the printerGrouoService without throwing any errors.
   */
  it("can add a print failure with or without log", async () => {
    const completionEntry = await printCompletionService.create({
      printerId: "5f14968b11034c4ca49e7c69",
      completionLog: "some log happened here",
      status: EVENT_TYPES.PrintStarted,
      fileName: "mycode.gcode",
      context: {},
    });
    expect(completionEntry._id).toBeTruthy();

    const completionEntryWithoutLog = await printCompletionService.create({
      printerId: "5f14968b11034c4ca49e7c69",
      status: EVENT_TYPES.PrintFailed,
      fileName: "mycode.gcode",
      context: {},
    });
    expect(completionEntryWithoutLog._id).toBeTruthy();
  });
});
