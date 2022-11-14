const printerFloorModel = require("../../models/PrinterFloor");
const dbHandler = require("../db-handler");
const DITokens = require("../../container.tokens");
const { configureContainer } = require("../../container");
const { PrinterGroupMockData } = require("./test-data/printer-group.data");

let printerGroupService;
let printerFloorService;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  printerGroupService = container.resolve(DITokens.printerGroupService);
  printerFloorService = container.resolve(DITokens.printerFloorService);
});
afterEach(async () => {
  await dbHandler.clearDatabase();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

/**
 * PrinterFloorService test suite.
 */
describe("PrinterFloorService ", () => {
  /**
   * Tests that a valid printer group can be created through the printerGrouoService without throwing any errors.
   */
  it("can be created correctly without printer group", async () => {
    // Create it
    await printerFloorService.create({
      name: "TopFloor1",
      floor: 1,
      printerGroups: [],
    });

    // Assert creation
    const createdPrinterGroup = await printerFloorModel.findOne();
    expect(createdPrinterGroup).toBeTruthy();
  });

  it("can delete existing floor", async () => {
    // Create it
    const floor = await printerFloorService.create({
      name: "TopFloor1",
      floor: 1,
      printerGroups: [],
    });

    expect(printerFloorService.get(floor.id)).toBeTruthy();
    await printerFloorService.delete(floor.id);
    expect(printerFloorService.get(floor.id)).rejects.toBeTruthy();
  });

  it("can add group to floor", async () => {
    // Prepare the CRUD DTO
    const newPrinterGroup = PrinterGroupMockData.PrinterGroupMock;
    const pg = await printerGroupService.create(newPrinterGroup);

    // Create it
    const floor = await printerFloorService.create({
      name: "TopFloor1",
      floor: 1,
      printerGroups: [],
    });

    expect(printerFloorService.get(floor.id)).toBeTruthy();
    const newFloor = await printerFloorService.addOrUpdatePrinterGroup(floor.id, {
      printerGroupId: pg.id,
    });
    expect(newFloor.printerGroups).toHaveLength(1);
  });

  it("can delete group from floor", async () => {
    // Prepare the CRUD DTO
    const newPrinterGroup = PrinterGroupMockData.PrinterGroupMock;
    const pg = await printerGroupService.create(newPrinterGroup);

    // Create it
    const floor = await printerFloorService.create({
      name: "TopFloor1",
      floor: 1,
      printerGroups: [{ printerGroupId: pg.id }],
    });

    // Check existence
    expect(printerFloorService.get(floor.id)).toBeTruthy();
    expect(floor.printerGroups).toHaveLength(1);

    const newFloor = await printerFloorService.removePrinterGroup(floor.id, {
      printerGroupId: pg.id,
    });
    expect(newFloor.printerGroups).toHaveLength(0);
  });
});
