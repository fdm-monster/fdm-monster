import { DITokens } from "@/container.tokens";
import { PrintCompletionService } from "@/services/orm/print-completion.service";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";
import { setupTestApp } from "../test-server";
import { AwilixContainer } from "awilix";
import { generateCorrelationToken } from "@/utils/correlation-token.util";
import { createTestPrinter } from "../api/test-data/create-printer";
import { Test } from "supertest";
import { IPrintCompletionService } from "@/services/interfaces/print-completion.interface";
import TestAgent from "supertest/lib/agent";

let container: AwilixContainer;
let printCompletionService: IPrintCompletionService;
let request: TestAgent<Test>;

beforeAll(async () => {
  ({ container, request } = await setupTestApp(true));
  printCompletionService = container.resolve(DITokens.printCompletionService);
});

describe(PrintCompletionService.name, () => {
  it("can add a print failure with or without log", async () => {
    const trackingToken = generateCorrelationToken();
    const printer = await createTestPrinter(request);
    const completionEntry = await printCompletionService.create({
      printerId: printer.id,
      completionLog: "some log happened here",
      status: EVENT_TYPES.PrintStarted,
      fileName: "mycode.gcode",
      context: {
        correlationId: trackingToken,
      },
    });
    expect(completionEntry.id).toBeTruthy();

    const completionEntryWithoutLog = await printCompletionService.create({
      printerId: printer.id,
      status: EVENT_TYPES.PrintFailed,
      fileName: "mycode.gcode",
      completionLog: undefined,
      context: {
        correlationId: trackingToken,
      },
    });
    expect(completionEntryWithoutLog.id).toBeTruthy();
  });
});
