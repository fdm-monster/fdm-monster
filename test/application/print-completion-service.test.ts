import { afterEach, afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { connect, clearDatabase, closeDatabase } from "../db-handler";
import { DITokens } from "@/container.tokens";
import { configureContainer } from "@/container";
import { PrintCompletionService } from "@/services/print-completion.service";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";

let printCompletionService;

beforeAll(async () => {
  await connect();
  const container = configureContainer();
  printCompletionService = container.resolve(DITokens.printCompletionService);
});
afterEach(async () => {
  await clearDatabase();
});
afterAll(async () => {
  await closeDatabase();
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
