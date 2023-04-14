const printerFloorModel = require("../../models/Floor");
const dbHandler = require("../db-handler");
const DITokens = require("../../container.tokens");
const { configureContainer } = require("../../container");
const { PrinterMockData } = require("./test-data/printer.data");

let floorService;
let printerService;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  printerService = container.resolve(DITokens.printerService);
  floorService = container.resolve(DITokens.floorService);
});
afterEach(async () => {
  await dbHandler.clearDatabase();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
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
    const createdPrinterGroup = await printerFloorModel.findOne();
    expect(createdPrinterGroup).toBeTruthy();
  });

  it("can delete existing floor", async () => {
    // Create it
    const floor = await floorService.create({
      name: "TopFloor1",
      floor: 1,
      printers: [],
    });

    expect(floorService.get(floor.id)).toBeTruthy();
    await floorService.delete(floor.id);
    expect(floorService.get(floor.id)).rejects.toBeTruthy();
  });

  it("can add printer to floor", async () => {
    // Prepare the CRUD DTO
    const newPrinter = PrinterMockData.PrinterMock;
    const pg = await printerService.create(newPrinter);

    // Create it
    const floor = await floorService.create({
      name: "TopFloor1",
      floor: 1,
      printers: [],
    });

    expect(floorService.get(floor.id)).toBeTruthy();
    const newFloor = await floorService.addOrUpdatePrinter(floor.id, {
      printerId: pg.id,
    });
    expect(newFloor.printers).toHaveLength(1);
  });

  it("can delete group from floor", async () => {
    // Prepare the CRUD DTO
    const newPrinter = PrinterMockData.PrinterMock;
    const printer = await printerService.create(newPrinter);

    // Create it
    const floor = await floorService.create({
      name: "TopFloor1",
      floor: 1,
      printers: [{ printerId: printer.id, x: 1, y: 1 }],
    });

    // Check existence
    expect(floorService.get(floor.id)).toBeTruthy();
    expect(floor.printers).toHaveLength(1);

    const newFloor = await floorService.removePrinter(floor.id, {
      printerId: pg.id,
    });
    expect(newFloor.printers).toHaveLength(0);
  });
});
