import { AwilixContainer } from "awilix";
import { UserService } from "@/services/authentication/user.service";
import { RoleService } from "@/services/authentication/role.service";
import { closeDatabase, connect } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { User } from "@/models";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { SettingsService } from "@/services/settings.service";

let container: AwilixContainer;
let settingsService: ISettingsService;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  settingsService = container.resolve<ISettingsService>(DITokens.settingsService);
});
afterEach(async () => {
  await User.deleteMany();
});
afterAll(async () => {
  await closeDatabase();
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
