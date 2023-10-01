import { isDocker } from "@/utils/is-docker";
jest.mock("../../../src/utils/is-docker");
import * as envUtils from "@/utils/env.utils";
jest.mock("../../../src/utils/env.utils", () => ({
  ...jest.requireActual("../../../src/utils/env.utils"),
  writeVariableToEnvFile: jest.fn(),
}));

import { isEnvProd, setupEnvConfig } from "@/server.env";
import { AppConstants } from "@/server.constants";

describe("ServerEnv", () => {
  it("Expect server env to not be production", () => {
    expect(isEnvProd()).toBe(false);
  });

  it("Should patch node env when in non-docker mode", () => {
    process.env[AppConstants.NODE_ENV_KEY] = "ILLEGAL_MODE";
    isDocker.mockReturnValueOnce(false);
    expect(setupEnvConfig()).toBeUndefined();
  });

  it("Skip patching env when all good", () => {
    const before = envUtils.writeVariableToEnvFile.mock.calls.length;
    expect(setupEnvConfig()).toBeUndefined();
    expect(envUtils.writeVariableToEnvFile.mock.calls.length - before).toBe(0);
  });

  it("Dont write when in docker mode", () => {
    isDocker.mockReturnValueOnce(false);
    expect(isDocker()).toBeFalsy();
  });
});
