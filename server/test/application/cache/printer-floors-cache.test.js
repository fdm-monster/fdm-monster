const dbHandler = require("../../db-handler");
const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const PrinterFloor = require("../../../models/Floor");

let container;
let printerFloorsCache;
let Model = PrinterFloor;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  printerFloorsCache = container.resolve(DITokens.printerFloorsCache);
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe(DITokens.printerFloorsCache, () => {
  it("should throw on getting non-existing floor", async function () {
    await expect(() => printerFloorsCache.getFloor("63452115122876ea11cd1656")).rejects.toBeDefined();
  });
  it("should delete floor", async function () {
    await printerFloorsCache.delete("63452115122876ea11cd1656");
  });
});
