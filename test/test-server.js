require("../utils/env.utils");
jest.mock("../utils/env.utils", () => ({
  ...jest.requireActual("../utils/env.utils"),
  writeVariableToEnvFile: jest.fn(),
}));
const supertest = require("supertest");
const { asClass, asValue } = require("awilix");
const { DITokens } = require("../container.tokens");
const { setupServer } = require("../server.core");
const { setupEnvConfig } = require("../server.env");
const AxiosMock = require("./mocks/axios.mock");
const OctoPrintApiMock = require("./mocks/octoprint-api.mock");
const { ROLES } = require("../constants/authorization.constants");

/**
 * Setup the application without hassle
 * @param loadPrinterStore (default: false) setup printer store with database connection
 * @param mocks allows overriding IoC container
 * @param quick_boot skip tasks
 * @returns {Promise<{container: AwilixContainer<any>, server: Server}>}
 */
async function setupTestApp(loadPrinterStore = false, mocks = undefined, quick_boot = true) {
  setupEnvConfig(true);

  const { httpServer, container } = await setupServer();
  container.register({
    [DITokens.octoPrintApiService]: asClass(OctoPrintApiMock).singleton(),
    [DITokens.httpClient]: asClass(AxiosMock).singleton(),
    [DITokens.appDefaultRole]: asValue(ROLES.ADMIN),
    [DITokens.appDefaultRoleNoLogin]: asValue(ROLES.ADMIN),
  });

  // Overrides get last pick
  if (mocks) container.register(mocks);

  // Setup
  const settingsStore = container.resolve(DITokens.settingsStore);
  await settingsStore.loadSettings();

  const serverHost = container.resolve(DITokens.serverHost);
  await serverHost.boot(httpServer, quick_boot, false);

  await settingsStore.setLoginRequired(false);
  await container.resolve(DITokens.permissionService).syncPermissions();
  await container.resolve(DITokens.roleService).syncRoles();

  if (loadPrinterStore) {
    // Requires (in-memory) database connection, so its optional
    const printerSocketStore = container.resolve(DITokens.printerSocketStore);
    await printerSocketStore.loadPrinterSockets();
  }

  return {
    httpServer,
    request: supertest(httpServer),
    container,
    [DITokens.httpClient]: container.resolve(DITokens.httpClient),
    [DITokens.octoPrintApiService]: container.resolve(DITokens.octoPrintApiService),
    [DITokens.taskManagerService]: container.resolve(DITokens.taskManagerService),
  };
}

module.exports = {
  setupTestApp,
};
