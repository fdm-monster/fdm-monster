import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { SettingsService } from "@/services/mongoose/settings.service";
import { setupTestApp } from "../test-server";
import { TypeormService } from "@/services/typeorm/typeorm.service";

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

    const freshSettings = settingsService.migrateSettingsRuntime(settings);
    expect(freshSettings).toBeTruthy();
    const dto = settingsService.toDto(freshSettings);
    expect(dto).toBeTruthy();
  });

  it("should set whitelist", async () => {
    await settingsService.setWhitelist(true, ["127.0.0.1"]);
  });
});
