import { connect } from "../../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { Floor } from "@/models";
import { FloorStore } from "@/state/floor.store";

let container;
let floorStore: FloorStore;
let Model = Floor;

beforeAll(async () => {
  await connect();
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

  it("should delete existing floor", async function () {
    const floors = await floorStore.listCache();
    expect(floors).toHaveLength(1);
    await floorStore.delete(floors[0].id);
  });

  it("should update floor", async () => {
    const floors = await floorStore.listCache();
    expect(floors).toHaveLength(1);
    await floorStore.update(floors[0].id, {
      name: "flo",
      floor: 1,
      printers: [],
    });
    const floors2 = await floorStore.listCache();
    expect(floors2).toHaveLength(1);
  });
});
