const isDockerUtility = require("../../../utils/is-docker");
jest.mock("../../../utils/is-docker");
const envUtils = require("../../../utils/env.utils");
jest.mock("../../../utils/env.utils", () => ({
  ...jest.requireActual("../../../utils/env.utils"),
  writeVariableToEnvFile: jest.fn()
}));

const { isEnvProd, setupEnvConfig } = require("../../../server.env");
const { AppConstants } = require("../../../server.constants");

describe("ServerEnv", () => {
  it("Expect server env to not be production", () => {
    expect(isEnvProd()).toBe(false);
  });

  it("Expect env utils to not create .env when in docker mode", () => {
    const before = isDockerUtility.isDocker.mock.calls.length;
    process.env[AppConstants.NODE_ENV_KEY] = "ILLEGAL_MODE";
    isDockerUtility.isDocker.mockReturnValueOnce(true);
    expect(setupEnvConfig()).toBeUndefined();
    // In CI we dont have .env and it will trigger 4 times
    expect(isDockerUtility.isDocker.mock.calls.length - before).toBeGreaterThanOrEqual(1);
  });

  it("Should patch node env when in non-docker mode", () => {
    process.env[AppConstants.NODE_ENV_KEY] = "ILLEGAL_MODE";
    isDockerUtility.isDocker.mockReturnValueOnce(false);
    expect(setupEnvConfig()).toBeUndefined();
  });

  it("Skip patching env when all good", () => {
    const before = envUtils.writeVariableToEnvFile.mock.calls.length;
    expect(setupEnvConfig()).toBeUndefined();
    expect(envUtils.writeVariableToEnvFile.mock.calls.length - before).toBe(0);
  });

  it("Dont write when in docker mode", () => {
    isDockerUtility.isDocker.mockReturnValueOnce(false);
    expect(isDockerUtility.isDocker()).toBeFalsy();
  });
});
