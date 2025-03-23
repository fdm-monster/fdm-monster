import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { MonsterPiService } from "@/services/core/monsterpi.service";

let monsterPiService: MonsterPiService;

beforeAll(async () => {
  const container = configureContainer();
  monsterPiService = container.resolve(DITokens.monsterPiService);
});

describe(MonsterPiService.name, () => {
  it("should not detect MonsterPi ", async () => {
    const version = monsterPiService.getMonsterPiVersionSafe();
    expect(version).toBeNull();
  });
});
