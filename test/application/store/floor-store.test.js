const dbHandler = require("../../db-handler");
const { configureContainer } = require("../../../container");
const { DITokens } = require("../../../container.tokens");
const { Floor } = require("../../../models/Floor");

let container;
let printerSocketStore;
let floorStore;
let Model = Floor;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  printerSocketStore = container.resolve(DITokens.printerSocketStore);
  floorStore = container.resolve(DITokens.floorStore);
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe(DITokens.floorStore, () => {
  it("should throw on getting non-existing floor", async function () {
    await expect(() => floorStore.getFloor("63452115122876ea11cd1656")).rejects.toBeDefined();
  });

  it("should delete floor", async function () {
    await floorStore.delete("63452115122876ea11cd1656");
  });

  it("should update floor", async () => {
    const floors = await floorStore.listCache();
    expect(floors).toHaveLength(1);
    await floorStore.update(floors[0], {
      name: "flo",
      floor: 1,
      printers: [],
    });
  });
});
