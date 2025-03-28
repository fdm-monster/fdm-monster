import { captureException, flush } from "@sentry/node";
import { setupEnvConfig } from "./server.env";
import { setupServer } from "./server.core";
import { DITokens } from "./container.tokens";
import { createPrinterSchema } from "@/services/validators/printer-service.validation";
import { Printer } from "@/entities";
import { OctoprintType } from "@/services/printer-api.interface";

createPrinterSchema.parse({
  printerType: OctoprintType,
  printerURL: "https://printers.github.io/",
  apiKey: "1234",
  name: "Printer",
} as Printer);

setupEnvConfig();

setupServer().then(({ httpServer, container }) => {
  container
    .resolve(DITokens.serverHost)
    .boot(httpServer)
    .catch(async (e: any | Error) => {
      console.error("Server has crashed unintentionally - please report this", e);

      captureException(e);
      await flush(0);
      process.exit(1);
    });
});
