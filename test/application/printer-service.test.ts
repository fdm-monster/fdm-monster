import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { testPrinterData } from "./test-data/printer.data";
import { AwilixContainer } from "awilix";
import { PrinterService } from "@/services/printer.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { Printer } from "@/entities";
import { Repository } from "typeorm";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { SqliteIdType } from "@/shared.constants";

let container: AwilixContainer;
let printerService: IPrinterService<SqliteIdType, Printer>;
let typeorm: TypeormService;
let printerRepository: Repository<Printer>;

beforeAll(async () => {
  container = configureContainer(true);
  printerService = container.resolve<IPrinterService<SqliteIdType, Printer>>(DITokens.printerService);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  printerRepository = typeorm.getDataSource().getRepository(Printer);
  await typeorm.createConnection();
});

afterEach(async () => {
  await typeorm.getDataSource().getRepository(Printer).delete({});
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
    const foundPrinter = await printerRepository.findOneBy({ id: printer.id });
    expect(foundPrinter).toBeDefined();
    expect(foundPrinter!.name).toEqual(updatedName);
  });
});
