import { setupEnvConfig } from "./server.env.js";
import { setupNormalServer } from "./server.core.js";

setupEnvConfig();
const { httpServer, container } = setupNormalServer();

container
  .resolve("serverHost")
  .boot(httpServer)
  .catch((e) => {
    console.error("Server has crashed unintentionally - please report this", e);
  });
