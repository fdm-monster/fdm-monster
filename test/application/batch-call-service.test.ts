import { DITokens } from "@/container.tokens";
import { validNewPrinterState } from "./test-data/printer.data";
import { BatchCallService } from "@/services/core/batch-call.service";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { setupTestApp } from "../test-server";
import { SqliteIdType } from "@/shared.constants";
import { Printer } from "@/entities";
import nock from "nock";

let batchCallService: BatchCallService;
let printerService: IPrinterService<SqliteIdType, Printer>;

beforeAll(async () => {
  const { container } = await setupTestApp(true);

  printerService = container.resolve<IPrinterService<SqliteIdType, Printer>>(DITokens.printerService);
  batchCallService = container.resolve(DITokens.batchCallService);
});

describe(BatchCallService.name, () => {
  it("should call multiple printers to get re-printable jobs", async () => {
    nock(validNewPrinterState.printerURL).get(/.*/).reply(200).post(/.*/).reply(200);

    const printer = await printerService.create(validNewPrinterState);
    const printer2 = await printerService.create(validNewPrinterState);

    const result = await batchCallService.getBatchPrinterReprintFile([printer.id, printer2.id]);
    expect(result).toHaveLength(2);
  });

  it("should call multiple printers ", async () => {
    nock(validNewPrinterState.printerURL).get(/.*/).reply(200).post(/.*/).reply(200);

    const printer = await printerService.create(validNewPrinterState);
    const printer2 = await printerService.create(validNewPrinterState);

    const result = await batchCallService.batchReprintCalls([
      {
        printerId: printer.id,
        path: "gcode",
      },
      { printerId: printer2.id, path: "gcode" },
    ]);
    expect(result).toHaveLength(2);
  });

  it("should return last print file details if available", async () => {
    // Setup: create printers and mock OctoprintClient responses for the job and connection status
    const printer = await printerService.create(validNewPrinterState);
    const printer2 = await printerService.create(validNewPrinterState);

    nock(printer.printerURL)
      .get("/api/job")
      .reply(200, { job: { file: { name: "test-file.gcode" } } });
    nock(printer2.printerURL)
      .get("/api/connection")
      .reply(200, { state: { text: "Operational" } });

    // Action: call getBatchPrinterReprintFile with valid printer IDs
    const result = await batchCallService.getBatchPrinterReprintFile([printer.id, printer2.id]);

    // Verify: ensure reprint file details are retrieved successfully
    expect(result).toHaveLength(2);
    expect(result[0].reprintState).toBe(2); // LastPrintReady
    expect(result[0].file?.name).toBe("test-file.gcode");
  });

  it("should return NoLastPrint state if no last print file is found", async () => {
    const printer = await printerService.create(validNewPrinterState);

    nock(printer.printerURL)
      .get("/api/job")
      .reply(200, { job: { file: {} } });
    nock(printer.printerURL)
      .get("/api/connection")
      .reply(200, { state: { text: "Operational" } });

    const result = await batchCallService.getBatchPrinterReprintFile([printer.id]);

    expect(result).toHaveLength(1);
    expect(result[0].reprintState).toBe(1); // NoLastPrint
    expect(result[0].file).toBeUndefined();
  });
});
