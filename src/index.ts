import { captureException, flush } from "@sentry/node";
import { setupEnvConfig } from "./server.env";
import { setupServer } from "./server.core";
import { DITokens } from "./container.tokens";
import { ServerHost } from "@/server.host";
import { config } from "dotenv";
import { LoggerService as Logger } from "@/handlers/logger";
import { join } from "node:path";
import { superRootPath } from "@/utils/fs.utils";
import { createStaticLogger } from "@/handlers/logging/static.logger";

config({ path: join(superRootPath(), "./.env") });
createStaticLogger({ enableFileLogs: true });

const logger = new Logger("FDM-Environment");
logger.log("✓ Parsed environment with (optional) .env file, created static logger");

setupEnvConfig();

setupServer().then(({ httpServer, container }) => {
  container
    .resolve<ServerHost>(DITokens.serverHost)
    .boot(httpServer)
    .catch(async (e: Error) => {
      console.error("Server has crashed unintentionally - please report this", e);

      captureException(e);
      await flush(0);
      process.exit(1);
    });
});
