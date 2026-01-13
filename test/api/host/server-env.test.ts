import { setupEnvConfig } from "@/server.env";
import { AppConstants } from "@/server.constants";

describe("ServerEnv", () => {
  it("should be able to set up environment config", () => {
    process.env[AppConstants.NODE_ENV_KEY] = "ILLEGAL_MODE";
    setupEnvConfig();
  });
});
