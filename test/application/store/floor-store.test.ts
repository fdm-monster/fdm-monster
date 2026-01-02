import { DITokens } from "@/container.tokens";
import { Floor } from "@/entities";
import { FloorStore } from "@/state/floor.store";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { setupTestApp } from "../../test-server";

let floorStore: FloorStore;
let typeormService: TypeormService;

beforeAll(async () => {
  const { container, typeormService: typeormService2 } = await setupTestApp(true);
  floorStore = container.resolve(DITokens.floorStore);
  typeormService = typeormService2;
});

beforeEach(async () => {
  await typeormService.getDataSource().getRepository(Floor).clear();
});

describe(DITokens.floorStore, () => {
  it("should throw on getting non-existing floor", async function () {
    await expect(() => floorStore.getFloor(404)).rejects.toBeDefined();
  });

  it("should delete existing floor", async function () {
    // Create a test floor first
    const floor = await floorStore.create({ name: "Test Floor", order: 1, printers: [] });
    const floors = await floorStore.listCache();
    expect(floors).toHaveLength(1);
    await floorStore.delete(floor.id);
    const floorsAfterDelete = await floorStore.listCache();
    expect(floorsAfterDelete).toHaveLength(0);
  });

  it("should update floor", async () => {
    // Create a test floor first
    const floor = await floorStore.create({ name: "Original", order: 1, printers: [] });
    const floors = await floorStore.listCache();
    expect(floors).toHaveLength(1);
    await floorStore.update(floor.id, {
      name: "flo",
      order: 2,
    });
    const floors2 = await floorStore.listCache();
    expect(floors2).toHaveLength(1);
    expect(floors2[0].name).toBe("flo");
    expect(floors2[0].order).toBe(2);
  });
});
