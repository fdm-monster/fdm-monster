import { isTestEnvironment, verifyPackageJsonRequirements } from "@/utils/env.utils";
import { describe, expect, it } from "@jest/globals";
import { join } from "path";

describe("Env util", () => {
  it("should pass validation", () => {
    expect(verifyPackageJsonRequirements(__dirname)).toEqual(false);

    expect(verifyPackageJsonRequirements(join(__dirname, "test-data"))).toEqual(true);
  });

  it("environment should be test", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(isTestEnvironment()).toBeTruthy();
  });
});
