import { captureException, flush } from "@sentry/node";
import { setupEnvConfig } from "./server.env";
import { setupServer } from "./server.core";
import { DITokens } from "./container.tokens";
import { ServerHost } from "@/server.host";
import { config } from "dotenv";
import { LoggerService as Logger } from "@/handlers/logger";
import { join } from "path";
import { superRootPath } from "@/utils/fs.utils";
import { createStaticLogger } from "@/handlers/logging/static.logger";
import { setupSwagger } from "@/utils/swagger/swagger";

config({ path: join(superRootPath(), "./.env") });
createStaticLogger({ enableFileLogs: true });

const logger = new Logger("FDM-Environment");
logger.log("✓ Parsed environment with (optional) .env file, created static logger");

setupEnvConfig();

setupServer().then(async ({ httpServer, container }) => {
  await setupSwagger(httpServer);

  container
    .resolve<ServerHost>(DITokens.serverHost)
    .boot(httpServer)
    .catch(async (e: any | Error) => {
      console.error("Server has crashed unintentionally - please report this", e);

      captureException(e);
      await flush(0);
      process.exit(1);
    });
});
