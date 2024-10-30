import { DITokens } from "@/container.tokens";
import { validNewPrinterState } from "./test-data/printer.data";
import { AxiosMock } from "../mocks/axios.mock";
import { BatchCallService } from "@/services/core/batch-call.service";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { setupTestApp } from "../test-server";
import { SqliteIdType } from "@/shared.constants";
import { Printer } from "@/entities";

let batchCallService: BatchCallService;
let printerService: IPrinterService<SqliteIdType, Printer>;

beforeAll(async () => {
  const { container } = await setupTestApp(true);

  printerService = container.resolve<IPrinterService<SqliteIdType, Printer>>(DITokens.printerService);
  batchCallService = container.resolve(DITokens.batchCallService);
});

beforeEach(() => {
  // httpClient.saveMockResponse(undefined, 200);
});

describe(BatchCallService.name, () => {
  it("should call multiple printers ", async () => {
    const printer = await printerService.create(validNewPrinterState);
    const printer2 = await printerService.create(validNewPrinterState);

    const result = await batchCallService.getBatchPrinterReprintFile([printer.id, printer2.id]);
    expect(result).toHaveLength(2);
  });

  it("should call multiple printers ", async () => {
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

    httpClient.saveMockResponse("https://asd.com:81/api/job", { job: { file: { name: "test-file.gcode" } } }, 200);
    httpClient.saveMockResponse("https://asd.com:81/api/connection", { state: { text: "Operational" } }, 200);

    // Action: call getBatchPrinterReprintFile with valid printer IDs
    const result = await batchCallService.getBatchPrinterReprintFile([printer.id, printer2.id]);

    // Verify: ensure reprint file details are retrieved successfully
    expect(result).toHaveLength(2);
    expect(result[0].reprintState).toBe(2); // LastPrintReady
    expect(result[0].file?.name).toBe("test-file.gcode");
  });

  it("should return NoLastPrint state if no last print file is found", async () => {
    const printer = await printerService.create(validNewPrinterState);

    httpClient.saveMockResponse("https://asd.com:81/api/job", { job: { file: {} } }, 200);
    httpClient.saveMockResponse("https://asd.com:81/api/connection", { state: { text: "Operational" } }, 200);

    const result = await batchCallService.getBatchPrinterReprintFile([printer.id]);

    expect(result).toHaveLength(1);
    expect(result[0].reprintState).toBe(1); // NoLastPrint
    expect(result[0].file).toBeUndefined();
  });
});
