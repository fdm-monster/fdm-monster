import { RefreshTokenService } from "@/services/authentication/refresh-token.service";
import { AwilixContainer } from "awilix";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { ensureTestUserCreated } from "../api/test-data/create-user";
import { SettingsStore } from "@/state/settings.store";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { RefreshToken } from "@/entities";
import { RefreshToken as RefreshTokenMongo } from "@/models";
import { SqliteIdType } from "@/shared.constants";
import { IRefreshTokenService } from "@/services/interfaces/refresh-token.service.interface";
import { isSqliteModeTest } from "../typeorm.manager";

let container: AwilixContainer;
let refreshTokenService: IRefreshTokenService<SqliteIdType>;
let settingsStore: SettingsStore;
let typeorm: TypeormService;

beforeAll(async () => {
  container = configureContainer(isSqliteModeTest());
  refreshTokenService = container.resolve<IRefreshTokenService<SqliteIdType>>(DITokens.refreshTokenService);
  settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  if (isSqliteModeTest()) {
    await typeorm.createConnection();
  }
});
afterEach(async () => {
  if (isSqliteModeTest()) {
    await typeorm.getDataSource().getRepository(RefreshToken).delete({});
  } else {
    await RefreshTokenMongo.deleteMany({});
  }
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
    expect(await refreshTokenService.getRefreshToken(refreshToken, false)).toBeNull();
  });
});
