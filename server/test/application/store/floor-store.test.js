const dbHandler = require("../../db-handler");
const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const { Floor } = require("../../../models/Floor");

let container;
let floorStore;
let Model = Floor;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
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
});
