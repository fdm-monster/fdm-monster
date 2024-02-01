import { PrinterFilesService } from "@/services/printer-files.service";
import { DITokens } from "@/container.tokens";
import { testPrinterData } from "./test-data/printer.data";
import { SqliteIdType } from "@/shared.constants";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { setupTestApp } from "../test-server";

let container;
let printerService: IPrinterService<SqliteIdType>;

let printerFilesService: PrinterFilesService;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  printerService = container.resolve<IPrinterService<SqliteIdType>>(DITokens.printerService);
  printerFilesService = container.resolve(DITokens.printerFilesService);
});
describe(PrinterFilesService.name, () => {
  it("should list printer files", async () => {
    const printer = await printerService.create(testPrinterData);

    const files = await printerFilesService.getPrinterFiles(printer.id);
    expect(files).toEqual([]);
  });
});
