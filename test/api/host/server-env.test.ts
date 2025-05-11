import { isEnvProd, setupEnvConfig } from "@/server.env";
import { AppConstants } from "@/server.constants";

describe("ServerEnv", () => {
  it("Expect server env to not be production", () => {
    expect(isEnvProd()).toBe(false);
  });

  it("Should patch node env when in non-docker mode", () => {
    process.env[AppConstants.NODE_ENV_KEY] = "ILLEGAL_MODE";
    expect(setupEnvConfig()).toBeUndefined();
  });
});
