const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const { DITokens } = require("../../container.tokens");

let monsterPiService;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  monsterPiService = container.resolve(DITokens.monsterPiService);
});
afterEach(async () => {
  await dbHandler.clearDatabase();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("MonsterPiService ", () => {
  it("should not detect MonsterPi ", async () => {
    const version = monsterPiService.getMonsterPiVersionSafe();
    expect(version).toBeNull();
  });
});
