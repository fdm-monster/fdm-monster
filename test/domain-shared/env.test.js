const envUtils = require("../../utils/env.utils");
const path = require("path");
const { isTestEnvironment } = require("../../utils/env.utils");

describe("Env util", () => {
  it("should pass validation", () => {
    expect(envUtils.verifyPackageJsonRequirements(__dirname)).toEqual(false);

    expect(envUtils.verifyPackageJsonRequirements(path.join(__dirname, "test-data"))).toEqual(true);
  });

  it("environment should be test", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(isTestEnvironment()).toBeTruthy();
  });
});
