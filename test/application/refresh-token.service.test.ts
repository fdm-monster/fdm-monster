import { RefreshTokenService } from "@/services/authentication/refresh-token.service";
import { AwilixContainer } from "awilix";
import { closeDatabase, connect } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { RefreshToken } from "@/models";
import { ensureTestUserCreated } from "../api/test-data/create-user";

let container: AwilixContainer;
let refreshTokenService: RefreshTokenService;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  refreshTokenService = container.resolve<RefreshTokenService>(DITokens.refreshTokenService);
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

  it("should purge refresh tokens", async () => {
    const user = await ensureTestUserCreated();
    await refreshTokenService.purgeOutdatedRefreshTokensByUserId(user.id);
  });
});
