/**
 * Safety check for Node 12
 */
let majorVersion = require("semver/functions/major")(process.version);
if (!!majorVersion && majorVersion < 14) {
  // Dont require this in the normal flow (or NODE_ENV can not be fixed before start)
  const { serveNode12Fallback, setupFallbackServer } = require("./server.fallback");
  const server = setupFallbackServer();
  return serveNode12Fallback(server);
}

/**
 * Intermediate server when booting
 */
const { setupEnvConfig } = require("./server.env");
setupEnvConfig();
// ... TODO

/**
 * Actual server operation
 */ const { setupNormalServer } = require("./server.core");
const { httpServer, container } = setupNormalServer();

container
  .resolve("serverHost")
  .boot(httpServer)
  .catch((e) => {
    console.error("Server has crashed unintentionally - please report this", e);
  });
