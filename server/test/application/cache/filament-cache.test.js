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
    const filaments = filamentCache.listFilaments();

    expect(filaments).toHaveLength(0);
  });
});
