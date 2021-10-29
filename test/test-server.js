const supertest = require("supertest");
const { asClass } = require("awilix");
const DITokens = require("../server/container.tokens");
const { setupNormalServer } = require("../server/server.core");
const { setupEnvConfig } = require("../server/server.env");
const AxiosMock = require("./mocks/axios.mock");
const OctoPrintApiMock = require("./mocks/octoprint-api.mock");

/**
 * Setup the application without hassle
 * @param loadPrinterStore (default: false) setup printer store with database connection
 * @param mocks allows overriding IoC container
 * @returns {Promise<{container: AwilixContainer<any>, server: Server}>}
 */
async function setupTestApp(loadPrinterStore = false, mocks) {
  setupEnvConfig(true);

  const { httpServer, container } = setupNormalServer();
  container.register({
    [DITokens.octoPrintApiService]: asClass(OctoPrintApiMock).singleton(),
    [DITokens.httpClient]: asClass(AxiosMock).singleton()
  });

  // Overrides get last pick
  if (mocks) container.register(mocks);

  // Setup
  await container.resolve(DITokens.settingsStore).loadSettings();
  const serverHost = container.resolve(DITokens.serverHost);
  await serverHost.boot(httpServer, true, false);

  if (loadPrinterStore) {
    // Requires (in-memory) database connection, so its optional
    const printersStore = container.resolve(DITokens.printersStore);
    await printersStore.loadPrintersStore();
  }

  return {
    httpServer,
    request: supertest(httpServer),
    container,
    [DITokens.octoPrintApiService]: container.resolve(DITokens.octoPrintApiService)
  };
}

module.exports = {
  setupTestApp
};
