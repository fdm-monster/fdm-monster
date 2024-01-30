import { DITokens } from "@/container.tokens";
import { Floor } from "@/entities";
import { Floor as FloorMongo } from "@/models";
import { FloorStore } from "@/state/floor.store";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { setupTestApp } from "../../test-server";
import { isSqliteModeTest } from "../../typeorm.manager";

let floorStore: FloorStore;
let typeormService: TypeormService;

beforeAll(async () => {
  const { container, typeormService: typeormService2 } = await setupTestApp(true);
  floorStore = container.resolve(DITokens.floorStore);
  typeormService = typeormService2;
});

beforeEach(async () => {
  if (isSqliteModeTest()) {
    await typeormService.getDataSource().getRepository(Floor).clear();
  } else {
    await FloorMongo.deleteMany({});
  }
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
    });
    const floors2 = await floorStore.listCache();
    expect(floors2).toHaveLength(1);
  });
});
