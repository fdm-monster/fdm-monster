const supertest = require("supertest");
const { asClass } = require("awilix");
const DITokens = require("../server/container.tokens");
const { setupExpressServer, serveControllerRoutes } = require("../server/app-core");
const { setupEnvConfig } = require("../server/app-env");
const { ensureSystemSettingsInitiated } = require("../server/app-core");
const OctoPrintApiMock = require("./mocks/octoprint-api.mock");
const AxiosMock = require("./mocks/axios.mock");

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
    [DITokens.octoPrintApiService]: asClass(OctoPrintApiMock).singleton(),
    [DITokens.httpClient]: asClass(AxiosMock).singleton()
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
