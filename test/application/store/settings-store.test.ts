import { DITokens } from "@/container.tokens";
import { SettingsStore } from "@/state/settings.store";
import { setupTestApp } from "../../test-server";

let settingsStore: SettingsStore;

beforeEach(async () => {
  const { container } = await setupTestApp(true);
  settingsStore = container.resolve(DITokens.settingsStore);
});

describe(SettingsStore.name, () => {
  it("should persist jwt secret and expiresIn", async () => {
    await settingsStore.persistOptionalCredentialSettings("1234567890", "123d");
    const creds = await settingsStore.getCredentialSettings();
    expect(creds.jwtExpiresIn).toBe(123);
    expect(creds.refreshTokenAttempts).toBe(-1);
  });
});
