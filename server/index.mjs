import { setupEnvConfig } from "./server.env.js";
import { setupServer } from "./server.core.js";
import * as sentry from "@sentry/node";

setupEnvConfig();

const { httpServer, container } = setupServer();

container
  .resolve("serverHost")
  .boot(httpServer)
  .catch(async (e) => {
    console.error("Server has crashed unintentionally - please report this", e);

    sentry.captureException(e);
    await sentry.flush(0);
    process.exit(1);
  });
