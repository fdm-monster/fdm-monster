import { closeDatabase, connect } from "../../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";
import { SettingsStore } from "@/state/settings.store";

let container: AwilixContainer;
let settingsStore: SettingsStore;

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  if (container) await container.dispose();
  container = configureContainer();
  settingsStore = container.resolve(DITokens.settingsStore);
});

afterAll(async () => {
  await closeDatabase();
});

describe(SettingsStore.name, () => {
  it("should persist jwt secret and expiresIn", async () => {
    await settingsStore.persistOptionalCredentialSettings("123123123", "123d");
    const creds = await settingsStore.getCredentialSettings();
    expect(creds.jwtExpiresIn).toBe(123);
    expect(creds.refreshTokenAttempts).toBe(-1);
  });
});
