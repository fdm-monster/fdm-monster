import { clearDatabase, closeDatabase, connect } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { afterEach } from "node:test";
import { MonsterPiService } from "@/services/core/monsterpi.service";

let monsterPiService: MonsterPiService;

beforeAll(async () => {
  await connect();
  const container = configureContainer();
  monsterPiService = container.resolve(DITokens.monsterPiService);
});
afterEach(async () => {
  await clearDatabase();
});
afterAll(async () => {
  await closeDatabase();
});

describe("MonsterPiService ", () => {
  it("should not detect MonsterPi ", async () => {
    const version = monsterPiService.getMonsterPiVersionSafe();
    expect(version).toBeNull();
  });
});
