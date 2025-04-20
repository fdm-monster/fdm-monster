import { captureException, flush } from "@sentry/node";
import { setupEnvConfig } from "./server.env";
import { setupServer } from "./server.core";
import { DITokens } from "./container.tokens";
import { ServerHost } from "@/server.host";
import { collectDefaultMetrics, register } from "prom-client";

// Optional: Enable collection of default metrics like memory, CPU, etc.
collectDefaultMetrics({ register });

setupEnvConfig();

setupServer().then(({ httpServer, container }) => {
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
