import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { closeDatabase, connect } from "../db-handler";
import { PrinterMockData } from "./test-data/printer.data";
import { Floor } from "@/models";
import { DITokens } from "@/container.tokens";
import { configureContainer } from "@/container";
import { FloorService } from "@/services/floor.service";
import { PrinterService } from "@/services/printer.service";

let floorService: FloorService;
let printerService: PrinterService;

beforeAll(async () => {
  await connect();
  const container = configureContainer();
  printerService = container.resolve(DITokens.printerService);
  floorService = container.resolve(DITokens.floorService);
});

afterAll(async () => {
  await closeDatabase();
});

/**
 * floorService test suite.
 */
describe("floorService ", () => {
  /**
   * Tests that a valid printer group can be created through the printerGrouoService without throwing any errors.
   */
  it("can be created correctly without printer group", async () => {
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
    const pg = await printerService.create(newPrinter);

    // Create it
    const floor = await floorService.create({
      name: "TopFloor1",
      floor: 3,
      printers: [],
    });

    expect(floorService.get(floor.id)).toBeTruthy();
    const newFloor = await floorService.addOrUpdatePrinter(floor.id, {
      printerId: pg.id,
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
