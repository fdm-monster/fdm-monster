import { AwilixContainer } from "awilix";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { ensureTestUserCreated } from "../api/test-data/create-user";
import { SettingsStore } from "@/state/settings.store";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { RefreshToken } from "@/entities";
import { SqliteIdType } from "@/shared.constants";
import { IRefreshTokenService } from "@/services/interfaces/refresh-token.service.interface";
import { RefreshTokenService } from "@/services/orm/refresh-token.service";

let container: AwilixContainer;
let refreshTokenService: IRefreshTokenService;
let settingsStore: SettingsStore;
let typeorm: TypeormService;

beforeAll(async () => {
  container = configureContainer();
  refreshTokenService = container.resolve<IRefreshTokenService<SqliteIdType>>(DITokens.refreshTokenService);
  settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  await typeorm.createConnection();
});
afterEach(async () => {
  await typeorm.getDataSource().getRepository(RefreshToken).clear();
});

describe(RefreshTokenService.name, () => {
  it("should purge refresh tokens", async () => {
    await refreshTokenService.purgeAllOutdatedRefreshTokens();
  });

  it("should purge refresh tokens of user", async () => {
    const user = await ensureTestUserCreated();
    await refreshTokenService.purgeOutdatedRefreshTokensByUserId(user.id);
  });

  it("should delete refresh token", async () => {
    await settingsStore.loadSettings();
    const user = await ensureTestUserCreated("test", "test");
    const refreshToken = await refreshTokenService.createRefreshTokenForUserId(user.id);
    await refreshTokenService.deleteRefreshToken(refreshToken);
    await expect(() => refreshTokenService.getRefreshToken(refreshToken)).rejects.toThrow();
  });
});
