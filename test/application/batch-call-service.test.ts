import { DITokens } from "@/container.tokens";
import { validNewPrinterState } from "./test-data/printer.data";
import { AxiosMock } from "../mocks/axios.mock";
import { BatchCallService } from "@/services/batch-call.service";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { setupTestApp } from "../test-server";
import { SqliteIdType } from "@/shared.constants";
import { Printer } from "@/entities";

let batchCallService: BatchCallService;
let printerService: IPrinterService<SqliteIdType, Printer>;
let httpClient: AxiosMock;

beforeAll(async () => {
  const { container, httpClient: axiosMock } = await setupTestApp(true);
  httpClient = axiosMock;

  printerService = container.resolve<IPrinterService<SqliteIdType, Printer>>(DITokens.printerService);
  batchCallService = container.resolve(DITokens.batchCallService);
});

beforeEach(() => {
  httpClient.saveMockResponse(undefined, 200);
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
});
