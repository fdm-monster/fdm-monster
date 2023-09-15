const { setupEnvConfig } = require("./server.env.js");
const { setupServer } = require("./server.core.js");
const sentry = require("@sentry/node");
const DITokens = require("./container.tokens.js");

setupEnvConfig();

setupServer().then(({ httpServer, container }) => {
  container
    .resolve(DITokens.serverHost)
    .boot(httpServer)
    .catch(async (e) => {
      console.error("Server has crashed unintentionally - please report this", e);

      sentry.captureException(e);
      await sentry.flush(0);
      process.exit(1);
    });
});
