import { PrinterService } from "@/services/printer.service";
import { PrinterFilesService } from "@/services/printer-files.service";
import { connect } from "../db-handler";
import { configureContainer } from "@/container";
import { Printer } from "@/models";
import { DITokens } from "@/container.tokens";
import { testPrinterData } from "./test-data/printer.data";

let container;
let printerService: PrinterService;

let printerFilesService: PrinterFilesService;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  printerService = container.resolve(DITokens.printerService);
  printerFilesService = container.resolve(DITokens.printerFilesService);
});

afterAll(async () => {
  return Printer.deleteMany({});
});

describe(PrinterFilesService.name, () => {
  it("should list printer files", async () => {
    const printer = await printerService.create(testPrinterData);

    const files = await printerFilesService.getPrinterFiles(printer.id);
    expect(files).toEqual([]);
  });
});
