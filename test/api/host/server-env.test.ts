import { isEnvProd, setupEnvConfig } from "@/server.env";
import { AppConstants } from "@/server.constants";

describe("ServerEnv", () => {
  it("Expect server env to not be production", () => {
    expect(isEnvProd()).toBe(false);
  });

  it("should be able to set up environment config", () => {
    process.env[AppConstants.NODE_ENV_KEY] = "ILLEGAL_MODE";
    expect(setupEnvConfig()).toBeUndefined();
  });
});
