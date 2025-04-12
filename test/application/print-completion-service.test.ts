import { DITokens } from "@/container.tokens";
import { PrintHistoryService } from "@/services/orm/print-history.service";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";
import { setupTestApp } from "../test-server";
import { AwilixContainer } from "awilix";
import { createTestPrinter } from "../api/test-data/create-printer";
import { Test } from "supertest";
import { IPrintHistoryService } from "@/services/interfaces/print-history.interface";
import { SqliteIdType } from "@/shared.constants";
import TestAgent from "supertest/lib/agent";
import { PrintLog } from "@/entities";

let container: AwilixContainer;
let printCompletionService: IPrintHistoryService<SqliteIdType, PrintLog>;
let request: TestAgent<Test>;

beforeAll(async () => {
  ({ container, request } = await setupTestApp(true));
  printCompletionService = container.resolve(DITokens.printCompletionService);
});

describe(PrintHistoryService.name, () => {
  it("can add a print failure with or without log", async () => {
    const printer = await createTestPrinter(request);
    const completionEntry = await printCompletionService.create({
      printerId: printer.id,
      status: EVENT_TYPES.PrintStarted,
      fileName: "mycode.gcode",
    });
    expect(completionEntry.id).toBeTruthy();

    const completionEntryWithoutLog = await printCompletionService.create({
      printerId: printer.id,
      status: EVENT_TYPES.PrintFailed,
      fileName: "mycode.gcode",
    });
    expect(completionEntryWithoutLog.id).toBeTruthy();
  });
});
