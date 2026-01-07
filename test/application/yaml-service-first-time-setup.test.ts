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
import { IRoleService } from "@/services/interfaces/role-service.interface";
import { User } from "@/entities";

interface TestServices {
  yamlService: YamlService;
  printerService: IPrinterService;
  floorService: IFloorService;
  settingsStore: SettingsStore;
  userService: IUserService;
  roleService: IRoleService;
}

describe("YamlService - First Time Setup Mode", () => {
  async function clearSettings(container: AwilixContainer, settingsStore: SettingsStore) {
    const typeormService = container.resolve<TypeormService>(DITokens.typeormService);
    const dataSource = typeormService.getDataSource();
    if (dataSource) {
      await dataSource.getRepository(Settings).clear();
      await dataSource.getRepository(User).clear();
    }
    await settingsStore.loadSettings();
  }

  function resolveServices(container: AwilixContainer): TestServices {
    return {
      yamlService: container.resolve(DITokens.yamlService),
      printerService: container.resolve(DITokens.printerService),
      floorService: container.resolve(DITokens.floorService),
      settingsStore: container.resolve(DITokens.settingsStore),
      userService: container.resolve(DITokens.userService),
      roleService: container.resolve(DITokens.roleService),
    };
  }

  async function verifyPrinters(printerService: IPrinterService) {
    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Great Cultivator")!;
    expect(printer).toBeDefined();
    return printer;
  }

  async function verifyFloors(floorService: IFloorService, printerId: string) {
    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor")!;
    expect(floor).toBeDefined();
    expect(floor.printers.length).toBeGreaterThan(0);
    expect(floor.printers.find((p) => p.printerId.toString() === printerId)).toBeDefined();
  }

  async function verifySettings(
    settingsStore: SettingsStore,
    expectedLoginRequired: boolean,
    expectedGridCols: number,
    expectedGridRows: number,
  ) {
    await settingsStore.loadSettings();
    const settings = settingsStore.getSettings();
    expect(await settingsStore.getLoginRequired()).toBe(expectedLoginRequired);
    expect(settingsStore.isWizardCompleted()).toBe(true);
    expect(settings.frontend.gridCols).toBe(expectedGridCols);
    expect(settings.frontend.gridRows).toBe(expectedGridRows);
  }

  async function verifyUsersAndRoles(userService: IUserService, roleService: IRoleService) {
    const users = await userService.listUsers();
    expect(users.length).toBeGreaterThan(0);
    const adminUser = users.find((u) => u.username === "admin");
    expect(adminUser).toBeDefined();
    expect(adminUser?.isRootUser).toBe(true);

    const adminRole = await roleService.getRoleByName("ADMIN");
    expect(adminRole).toBeDefined();
    expect(adminRole?.name).toBe("ADMIN");
  }

  async function testYamlImport(
    yamlFileName: string,
    expectedLoginRequired: boolean,
    expectedGridCols: number,
    expectedGridRows: number,
  ) {
    const { container } = await setupTestApp(true, undefined, true, true);
    const services = resolveServices(container);

    await clearSettings(container, services.settingsStore);

    const buffer = readFileSync(join(__dirname, `./test-data/${yamlFileName}`));
    expect(services.settingsStore.isWizardCompleted()).toBe(false);

    await services.yamlService.importYaml(buffer.toString());

    const printer = await verifyPrinters(services.printerService);
    await verifyFloors(services.floorService, printer.id.toString());
    await verifySettings(services.settingsStore, expectedLoginRequired, expectedGridCols, expectedGridRows);
    await verifyUsersAndRoles(services.userService, services.roleService);
  }

  it("should import 1.9.1 mongodb full yaml with system data during first-time setup", async () => {
    await testYamlImport("export-fdm-monster-1.9.1-mongodb-full.yaml", true, 2, 2);
  });

  it("should import 1.9.1 sqlite full yaml with system data during first-time setup", async () => {
    await testYamlImport("export-fdm-monster-1.9.1-sqlite-full.yaml", false, 2, 2);
  });

  it("should import 2.0.1 sqlite full yaml with system data during first-time setup", async () => {
    await testYamlImport("export-fdm-monster-2.0.1-sqlite-full.yaml", false, 4, 4);
  });
});
