import {server} from "./constants/server-settings.constants.js";
import {serveNode12Fallback} from "./server.fallback.js";
import {setupEnvConfig} from "./server.env.js";
import {setupNormalServer} from "./server.core.js";

/**
 * Safety check for Node 12
 */
let majorVersion = process.version;
if (!!majorVersion && majorVersion < 14) {
    // Dont require this in the normal flow (or NODE_ENV can not be fixed before start)
    serveNode12Fallback(server);
    process.exit(1);
}

/**
 * Intermediate server when booting
 */
setupEnvConfig();
// ... TODO
/**
 * Actual server operation
 */

const {httpServer, container} = setupNormalServer();
container
    .resolve("serverHost")
    .boot(httpServer)
    .catch((e) => {
        console.error("Server has crashed unintentionally - please report this", e);
    });
