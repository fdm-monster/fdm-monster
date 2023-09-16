import { captureException, flush } from "@sentry/node";
const { setupEnvConfig } = require("./server.env");
const { setupServer } = require("./server.core");
const DITokens = require("./container.tokens");

setupEnvConfig();

setupServer().then(({ httpServer, container }) => {
  container
    .resolve(DITokens.serverHost)
    .boot(httpServer)
    .catch(async (e) => {
      console.error("Server has crashed unintentionally - please report this", e);

      captureException(e);
      await flush(0);
      process.exit(1);
    });
});
