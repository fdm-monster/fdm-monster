import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { testPrinterData } from "./test-data/printer.data";
import { AwilixContainer } from "awilix";
import { PrinterService } from "@/services/mongoose/printer.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { Printer } from "@/entities";
import { Printer as PrinterMongo } from "@/models";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { isSqliteModeTest } from "../typeorm.manager";

let container: AwilixContainer;
let printerService: IPrinterService<SqliteIdType, Printer>;
let typeorm: TypeormService;

beforeAll(async () => {
  container = configureContainer(isSqliteModeTest());
  printerService = container.resolve<IPrinterService<SqliteIdType, Printer>>(DITokens.printerService);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  if (isSqliteModeTest()) {
    await typeorm.createConnection();
  }
});

afterEach(async () => {
  if (isSqliteModeTest()) {
    await typeorm.getDataSource().getRepository(Printer).clear();
  } else {
    await PrinterMongo.deleteMany({});
  }
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
