let majorVersion = null;
try {
  majorVersion = parseInt(process.version.replace("v", "").split(".")[0]);
} catch (e) {
  // We dont abort on parsing failures
}

if (!!majorVersion && majorVersion < 14) {
  // Dont require this in the normal flow (or NODE_ENV can not be fixed before start)
  const {
    serveNodeVersionFallback,
    setupFallbackExpressServer
  } = require("./server/app-fallbacks");

  const server = setupFallbackExpressServer();
  serveNodeVersionFallback(server);
} else {
  const {
    setupEnvConfig,
    fetchMongoDBConnectionString,
    runMigrations,
    fetchServerPort
  } = require("./server/app-env");

  // Set environment/.env file and NODE_ENV if not set. Will call startup checks.
  setupEnvConfig();

  const {
    setupExpressServer,
    serveOctoFarmNormally,
    ensureSystemSettingsInitiated
  } = require("./server/app-core");

  const DITokens = require("./server/container.tokens");
  const mongoose = require("mongoose");
  const Logger = require("./server/handlers/logger.js");
  const logger = new Logger("OctoFarm-Server");

  const { app: server, container } = setupExpressServer();

  mongoose
    .connect(fetchMongoDBConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      serverSelectionTimeoutMS: 2500
    })
    .then(async (mg) => {
      await runMigrations(mg.connection.db, mg.connection.getClient());
      await ensureSystemSettingsInitiated(container);
    })
    .then(async () => {
      const port = fetchServerPort();

      // Shit hit the fan
      if (!port || Number.isNaN(parseInt(port))) {
        throw new Error("The OctoFarm server requires a numeric port input argument to run");
      }

      const app = await serveOctoFarmNormally(server, container);
      app.listen(port, "0.0.0.0", () => {
        logger.info(`Server started... open it at http://127.0.0.1:${port}`);
      });
    })
    .catch(async (err) => {
      logger.error(err.stack);
      const { serveDatabaseIssueFallback } = require("./server/app-fallbacks");
      serveDatabaseIssueFallback(server, fetchServerPort());
    });
}
