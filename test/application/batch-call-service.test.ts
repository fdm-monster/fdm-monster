import { DITokens } from "@/container.tokens";
import { validNewPrinterState } from "./test-data/printer.data";
import { BatchCallService } from "@/services/core/batch-call.service";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { setupTestApp } from "../test-server";
import nock from "nock";

let batchCallService: BatchCallService;
let printerService: IPrinterService;

beforeAll(async () => {
  const { container } = await setupTestApp(true);

  printerService = container.resolve<IPrinterService>(DITokens.printerService);
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
    const printer2 = await printerService.create(validNewPrinterState); // will not resolve

    nock(printer.printerURL)
      .get("/api/job")
      .reply(200, { job: { file: { path: "test-file.gcode", name: "test-file.gcode" } } });
    nock(printer.printerURL)
      .get("/api/connection")
      .reply(200, { state: { text: "Operational" } });

    // Action: call getBatchPrinterReprintFile with valid printer IDs
    const result = await batchCallService.getBatchPrinterReprintFile([printer.id, printer2.id]);

    // Verify: ensure reprint file details are retrieved successfully
    expect(result).toHaveLength(2);
    expect(result[0].reprintState).toBe(2); // LastPrintReady
    expect(result[0].file?.path).toBe("test-file.gcode");

    expect(result[1].reprintState).toBe(0); // NoLastPrint
    expect(result[1].file?.path).toBeUndefined();
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
