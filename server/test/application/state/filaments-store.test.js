const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const dbHandler = require("../../db-handler");
const { testNewSpool } = require("../test-data/filament.data");

let container;
let filamentsStore;
let filamentService;

beforeAll(async () => {
  await dbHandler.connect();
});

beforeEach(async () => {
  if (container) container.dispose();
  container = configureContainer();
  filamentsStore = container.resolve(DITokens.filamentsStore);
  filamentService = container.resolve(DITokens.filamentService);
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("FilamentsStore", () => {
  it("should load FilamentsStore", async () => {
    const entity = await filamentService.create(testNewSpool);
    expect(entity.id).toBeTruthy();

    // Test the filament is cached after boot
    await filamentsStore.loadFilamentsStore();
    const filaments = filamentsStore.listFilaments();
    expect(filaments).toHaveLength(1);
    expect(filaments[0].id).toBeTruthy();
    expect(filaments[0]._id).toBeUndefined();
  });
});
