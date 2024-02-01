import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";
import { SettingsStore } from "@/state/settings.store";
import { setupTestApp } from "../../test-server";

let container: AwilixContainer;
let settingsStore: SettingsStore;

beforeEach(async () => {
  const { container } = await setupTestApp(true);
  settingsStore = container.resolve(DITokens.settingsStore);
});

describe(SettingsStore.name, () => {
  it("should persist jwt secret and expiresIn", async () => {
    await settingsStore.persistOptionalCredentialSettings("123123123", "123d");
    const creds = await settingsStore.getCredentialSettings();
    expect(creds.jwtExpiresIn).toBe(123);
    expect(creds.refreshTokenAttempts).toBe(-1);
  });
});
