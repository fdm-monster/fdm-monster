const dbHandler = require("../../db-handler");
const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const PrinterFloor = require("../../../models/Floor");

let container;
let floorCache;
let Model = PrinterFloor;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  floorCache = container.resolve(DITokens.floorCache);
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe(DITokens.floorCache, () => {
  it("should throw on getting non-existing floor", async function () {
    await expect(() => floorCache.getFloor("63452115122876ea11cd1656")).rejects.toBeDefined();
  });
  it("should delete floor", async function () {
    await floorCache.delete("63452115122876ea11cd1656");
  });
});
