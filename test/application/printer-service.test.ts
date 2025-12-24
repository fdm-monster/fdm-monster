import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { testPrinterData } from "./test-data/printer.data";
import { AwilixContainer } from "awilix";
import { PrinterService } from "@/services/orm/printer.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { Printer } from "@/entities";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { SqliteIdType } from "@/shared.constants";

let container: AwilixContainer;
let printerService: IPrinterService<SqliteIdType, Printer>;
let typeorm: TypeormService;

beforeAll(async () => {
  container = configureContainer();
  printerService = container.resolve<IPrinterService<SqliteIdType, Printer>>(DITokens.printerService);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  await typeorm.createConnection();
});

afterEach(async () => {
  await typeorm.getDataSource().getRepository(Printer).clear();
});

describe(PrinterService.name, () => {
  it("Must be able to rename a created printer", async () => {
    const printer = await printerService.create(testPrinterData);
    const updatedName = "newName";
    const printerUpdate = {
      ...testPrinterData,
      name: updatedName,
    };

    await printerService.update(printer.id, printerUpdate);
    const foundPrinter = await printerService.get(printer.id);
    expect(foundPrinter).toBeDefined();
    expect(foundPrinter!.name).toEqual(updatedName);
  });
});
