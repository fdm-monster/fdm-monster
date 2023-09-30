import { closeDatabase, connect } from "../db-handler";
import { PrinterMockData } from "./test-data/printer.data";
import { Floor } from "@/models/Floor";
import { DITokens } from "@/container.tokens";
import { configureContainer } from "@/container";
import { FloorService } from "@/services/floor.service";
import { PrinterService } from "@/services/printer.service";
import { IFloorService } from "@/services/interfaces/floor.service.interface";

let floorService: IFloorService;
let printerService: PrinterService;

beforeAll(async () => {
  await connect();
  const container = configureContainer();
  printerService = container.resolve<PrinterService>(DITokens.printerService);
  floorService = container.resolve<IFloorService>(DITokens.floorService);
});

afterAll(async () => {
  await closeDatabase();
});

describe(FloorService.name, () => {
  it("can be created correctly without printers", async () => {
    // Create it
    await floorService.create({
      name: "TopFloor1",
      floor: 1,
      printers: [],
    });

    // Assert creation
    const floor = await Floor.findOne();
    expect(floor).toBeTruthy();
  });

  it("dto mapping floor", async () => {
    const floor = await floorService.create({
      name: "TopFloor1",
      floor: 11,
      printers: [],
    });
    const dto = floorService.toDto(floor);
    expect(dto).toBeTruthy();
    expect(typeof dto.id).toBe("string");
  });

  it("can delete existing floor", async () => {
    // Create it
    const floor = await floorService.create({
      name: "TopFloor1",
      floor: 2,
      printers: [],
    });

    expect(floorService.get(floor.id)).toBeTruthy();
    await floorService.delete(floor.id);
    expect(floorService.get(floor.id)).rejects.toBeTruthy();
  });

  it("can not add printer to floor", async () => {
    // Prepare the CRUD DTO
    const newPrinter = PrinterMockData.PrinterMock;
    const pos = await printerService.create(newPrinter);

    // Create it
    const floor = await floorService.create({
      name: "TopFloor1",
      floor: 3,
      printers: [],
    });

    expect(floorService.get(floor.id)).toBeTruthy();
    const newFloor = await floorService.addOrUpdatePrinter(floor.id, {
      printerId: pos.id,
      x: 1,
      y: 1,
    });
    expect(newFloor.printers).toHaveLength(1);
  });

  it("can delete printer from floor", async () => {
    // Prepare the CRUD DTO
    const newPrinter = PrinterMockData.PrinterMock;
    const printer = await printerService.create(newPrinter);

    // Create it
    const floor = await floorService.create({
      name: "TopFloor1",
      floor: 4,
      printers: [{ printerId: printer.id, x: 1, y: 1 }],
    });

    // Check existence
    expect(floorService.get(floor.id)).toBeTruthy();
    expect(floor.printers).toHaveLength(1);

    // TODO when printerId is undefined error should be thrown
    const newFloor = await floorService.removePrinter(floor.id, {
      printerId: printer.id,
      x: 1,
      y: 1,
    });
    expect(newFloor.printers).toHaveLength(0);
  });
});
