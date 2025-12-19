import { YamlService } from "@/services/core/yaml.service";
import { DITokens } from "@/container.tokens";
import { setupTestApp } from "../test-server";
import { join } from "path";
import { readFileSync } from "node:fs";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { SettingsStore } from "@/state/settings.store";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { Settings } from "@/entities/settings.entity";
import { AwilixContainer } from "awilix";
import { Settings as SettingsMongo, User as UserMongo } from "@/models";
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { User } from "@/entities";

describe("YamlService - First Time Setup Mode", () => {
  async function clearSettings(container: AwilixContainer, settingsStore: SettingsStore, isTypeormMode: boolean) {
    if (isTypeormMode) {
      // Clear TypeORM database
      const typeormService = container.resolve<TypeormService>(DITokens.typeormService);
      const dataSource = typeormService.getDataSource();
      if (dataSource) {
        await dataSource.getRepository(Settings).clear();
        await dataSource.getRepository(User).clear();
      }
    } else {
      // Clear MongoDB database directly
      await SettingsMongo.deleteMany({});
      await UserMongo.deleteMany({});
    }
    // Reload settings to get a fresh copy with wizard incomplete
    await settingsStore.loadSettings();
  }

  it("should import 1.9.1 mongodb full yaml with system data during first-time setup", async () => {
    const { container, isTypeormMode, idType } = await setupTestApp(true, undefined, true, true);
    const yamlService: YamlService = container.resolve(DITokens.yamlService);
    const printerService: IPrinterService<typeof idType> = container.resolve(DITokens.printerService);
    const floorService: IFloorService<typeof idType> = container.resolve(DITokens.floorService);
    const settingsStore: SettingsStore = container.resolve(DITokens.settingsStore);
    const userService: IUserService<typeof idType> = container.resolve(DITokens.userService);
    const roleService = container.resolve<IRoleService>(DITokens.roleService);

    // Clear settings to ensure fresh state for this test
    await clearSettings(container, settingsStore, isTypeormMode);

    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.9.1-mongodb-full.yaml"));

    // Verify wizard is not completed at start
    expect(settingsStore.isWizardCompleted()).toBe(false);

    await yamlService.importYaml(buffer.toString());

    // Verify printers were imported
    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Great Cultivator")!;
    expect(printer).toBeDefined();

    // Verify floors were imported
    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(1);
    expect(floor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();

    // Verify system data (settings, users) were imported
    // Need to reload settings after import
    await settingsStore.loadSettings();
    const settings = settingsStore.getSettings();
    expect(await settingsStore.getLoginRequired()).toBe(true);
    expect(settingsStore.isWizardCompleted()).toBe(true);
    expect(settings.frontend.gridCols).toBe(2);
    expect(settings.frontend.gridRows).toBe(2);

    // Verify users were imported
    const users = await userService.listUsers();
    expect(users.length).toBeGreaterThan(0);
    const adminUser = users.find((u) => u.username === "admin");
    expect(adminUser).toBeDefined();
    expect(adminUser?.isRootUser).toBe(true);

    // Verify ADMIN role was imported
    const adminRole = await roleService.getRoleByName("ADMIN");
    expect(adminRole).toBeDefined();
    expect(adminRole?.name).toBe("ADMIN");
  });

  it("should import 1.9.1 sqlite full yaml with system data during first-time setup", async () => {
    const { container, isTypeormMode, idType } = await setupTestApp(true, undefined, true, true);
    const yamlService: YamlService = container.resolve(DITokens.yamlService);
    const printerService: IPrinterService<typeof idType> = container.resolve(DITokens.printerService);
    const floorService: IFloorService<typeof idType> = container.resolve(DITokens.floorService);
    const settingsStore: SettingsStore = container.resolve(DITokens.settingsStore);
    const userService: IUserService<typeof idType> = container.resolve(DITokens.userService);
    const roleService = container.resolve<IRoleService>(DITokens.roleService);

    // Clear settings to reset wizard status from previous test (in-memory database is shared)
    await clearSettings(container, settingsStore, isTypeormMode);

    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.9.1-sqlite-full.yaml"));

    // Verify wizard is not completed at start
    expect(settingsStore.isWizardCompleted()).toBe(false);

    await yamlService.importYaml(buffer.toString());

    // Verify printers were imported
    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Great Cultivator")!;
    expect(printer).toBeDefined();

    // Verify floors were imported
    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(1);
    expect(floor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();

    // Verify system data (settings, users) were imported
    // Need to reload settings after import
    await settingsStore.loadSettings();
    const settings = settingsStore.getSettings();
    expect(await settingsStore.getLoginRequired()).toBe(false);
    expect(settingsStore.isWizardCompleted()).toBe(true);
    expect(settings.frontend.gridCols).toBe(2);
    expect(settings.frontend.gridRows).toBe(2);

    // Verify users were imported
    const users = await userService.listUsers();
    expect(users.length).toBeGreaterThan(0);
    const adminUser = users.find((u) => u.username === "admin");
    expect(adminUser).toBeDefined();
    expect(adminUser?.isRootUser).toBe(true);

    // Verify ADMIN role was imported
    const adminRole = await roleService.getRoleByName("ADMIN");
    expect(adminRole).toBeDefined();
    expect(adminRole?.name).toBe("ADMIN");
  });
});
