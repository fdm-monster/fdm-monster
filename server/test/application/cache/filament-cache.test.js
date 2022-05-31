const dbHandler = require("../../db-handler");
const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");

let container;
let filamentCache;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  filamentCache = container.resolve(DITokens.filamentCache);
  const printersStore = container.resolve(DITokens.printersStore);
  await printersStore.loadPrintersStore();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("FilamentCache", function () {
  it("should have default values", () => {
    const spools = filamentCache.listFilaments();
    const stats = filamentCache.getStatistics();
    const selectedFilamentList = filamentCache.getSelected();

    expect(spools).toHaveLength(0);
    expect(stats).toHaveLength(0);
    expect(selectedFilamentList).toHaveLength(0);
  });

  it("should create stats with minimal input", async () => {
    const result = filamentCache.createStatistics([], [], []);

    expect(result).toMatchObject({
      materialList: [],
      used: expect.any(Number),
      total: expect.any(Number),
      price: expect.any(Number),
      profileCount: 0,
      spoolCount: 0,
      activeSpools: expect.any(Array),
      activeSpoolCount: expect.any(Number),
      materialBreakDown: []
    });
  });
});
