const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const dbHandler = require("../../db-handler");

let container;
let filamentsStore;

beforeAll(async () => {
  await dbHandler.connect();
});

beforeEach(async () => {
  if (container) container.dispose();
  container = configureContainer();
  filamentsStore = container.resolve(DITokens.filamentsStore);
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("FilamentsStore", () => {
  it("should load FilamentsStore", async () => {
    await filamentsStore.loadFilamentsStore();
  });
});
