import { RefreshTokenService } from "@/services/authentication/refresh-token.service";
import { AwilixContainer } from "awilix";
import { closeDatabase, connect } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { RefreshToken } from "@/models";
import { ensureTestUserCreated } from "../api/test-data/create-user";
import { SettingsStore } from "@/state/settings.store";

let container: AwilixContainer;
let refreshTokenService: RefreshTokenService;
let settingsStore: SettingsStore;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  refreshTokenService = container.resolve<RefreshTokenService>(DITokens.refreshTokenService);
  settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);
});
afterEach(async () => {
  await RefreshToken.deleteMany();
});
afterAll(async () => {
  await closeDatabase();
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
