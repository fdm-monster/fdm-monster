import { connect, clearDatabase, closeDatabase } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { afterEach } from "node:test";

let monsterPiService;

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
