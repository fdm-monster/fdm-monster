import { asValue, AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { setupServer } from "@/server.core";
import { setupEnvConfig } from "@/server.env";
import { ROLES } from "@/constants/authorization.constants";
import supertest, { Test } from "supertest";
import type { Express } from "express";
import { AppConstants } from "@/server.constants";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { TaskManagerService } from "@/services/task-manager.service";
import TestAgent from "supertest/lib/agent";
import { SettingsStore } from "@/state/settings.store";

export async function setupTestApp(
  loadPrinterStore = false,
  mocks: any = undefined,
  quickBoot = true,
  skipWizardCompletion = false,
): Promise<{
  container: AwilixContainer;
  httpServer: Express;
  request: TestAgent<Test>;
  typeormService: TypeormService;
  [k: string]: any;
}> {
  setupEnvConfig();

  const { httpServer, container } = await setupServer();
  container.register({
    [DITokens.appDefaultRole]: asValue(ROLES.ADMIN),
    [DITokens.appDefaultRoleNoLogin]: asValue(ROLES.ADMIN),
  });

  // Overrides get last pick
  if (mocks) container.register(mocks);

  // Setup sqlite database in memory - needed for loading settings etc
  const typeormService = container.resolve<TypeormService>(DITokens.typeormService);
  await typeormService.createConnection();

  // Setup
  const settingsStore = container.resolve<SettingsStore>(DITokens.settingsStore);
  await settingsStore.loadSettings();
  await settingsStore.setExperimentalMoonrakerSupport(true);

  const serverHost = container.resolve(DITokens.serverHost);
  await serverHost.boot(httpServer, quickBoot, false);

  if (!skipWizardCompletion) {
    await settingsStore.setWizardCompleted(AppConstants.currentWizardVersion);
  }
  await settingsStore.setLoginRequired(false);
  await container.resolve(DITokens.permissionService).syncPermissions();
  await container.resolve(DITokens.roleService).syncRoles();

  // Ensure file storage directories exist (needed for file upload tests)
  const fileStorageService = container.resolve(DITokens.fileStorageService);
  await fileStorageService.ensureStorageDirectories();

  if (loadPrinterStore) {
    // Requires (in-memory) database connection, so its optional
    const printerSocketStore = container.resolve(DITokens.printerSocketStore);
    await printerSocketStore.loadPrinterSockets();
  }

  return {
    httpServer,
    request: supertest(httpServer),
    container,
    [DITokens.taskManagerService]: container.resolve<TaskManagerService>(DITokens.taskManagerService),
    [DITokens.typeormService]: container.resolve<TypeormService>(DITokens.typeormService),
  };
}
