const DITokens = require("./container.tokens");
const { setupExpressServer, serveControllerRoutes } = require("./app-core");
const { setupEnvConfig } = require("./app-env");
const { ensureSystemSettingsInitiated } = require("./app-core");
const supertest = require("supertest");
const { asClass } = require("awilix");
const OctoPrintApiMock = require("../test/mocks/octoprint-api.mock");

/**
 * Setup the application without hassle
 * @param loadPrinterStore (default: false) setup printer store with database connection
 * @returns {Promise<{container: AwilixContainer<any>, server: Server}>}
 */
async function setupTestApp(loadPrinterStore = false, mocks) {
  setupEnvConfig(true);

  const { app: server, container } = setupExpressServer();
  await ensureSystemSettingsInitiated(container);
  serveControllerRoutes(server);

  if (loadPrinterStore) {
    // Requires (in-memory) database connection, so its optional
    const printersStore = container.resolve(DITokens.printersStore);
    await printersStore.loadPrintersStore();
  }

  if (mocks) container.register(mocks);
  container.register({
    [DITokens.octoPrintApiService]: asClass(OctoPrintApiMock).singleton()
  });

  return {
    server,
    request: supertest(server),
    container,
    [DITokens.octoPrintApiService]: container.resolve(DITokens.octoPrintApiService)
  };
}

module.exports = {
  setupTestApp
};
