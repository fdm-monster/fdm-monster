import { connect, clearDatabase, closeDatabase } from "../db-handler";
import { DITokens } from "@/container.tokens";
import { configureContainer } from "@/container";
import { PrintCompletionService } from "@/services/print-completion.service";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";

let printCompletionService: PrintCompletionService;

beforeAll(async () => {
  const container = configureContainer();
  printCompletionService = container.resolve(DITokens.printCompletionService);
});

describe(PrintCompletionService.name, () => {
  /**
   * Tests that a valid completion can be created through the service without throwing any errors.
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
