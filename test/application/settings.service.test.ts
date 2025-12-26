import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { setupTestApp } from "../test-server";
import { migrateSettingsRuntime } from "@/shared/runtime-settings.migration";
import { SettingsService } from "@/services/orm/settings.service";

let container: AwilixContainer;
let settingsService: ISettingsService;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  settingsService = container.resolve<ISettingsService>(DITokens.settingsService);
});

describe(SettingsService.name, () => {
  it("should get settings", async () => {
    const settings = await settingsService.getOrCreate();
    expect(settings).toBeTruthy();

    const freshSettings = migrateSettingsRuntime(settings);
    expect(freshSettings).toBeTruthy();
    const dto = settingsService.toDto(freshSettings);
    expect(dto).toBeTruthy();
  });
});
