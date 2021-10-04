const DITokens = require("./container.tokens");
const { setupExpressServer, serveControllerRoutes } = require("./app-core");
const { setupEnvConfig } = require("./app-env");
const { ensureSystemSettingsInitiated } = require("./app-core");

/**
 * Setup the application without hassle
 * @param loadPrinterStore (default: false) setup printer store with database connection
 * @returns {Promise<{container: AwilixContainer<any>, server: Server}>}
 */
async function setupTestApp(loadPrinterStore = false) {
  setupEnvConfig(true);

  const { app: server, container } = setupExpressServer();
  await ensureSystemSettingsInitiated(container);
  serveControllerRoutes(server);

  if (loadPrinterStore) {
    // Testing setup explicitly requested the store to be loaded, assuming a database is setup.
    const printersStore = container.resolve(DITokens.printersStore);
    await printersStore.loadPrintersStore();
  }

  return { server, container };
}

module.exports = {
  setupTestApp
};
