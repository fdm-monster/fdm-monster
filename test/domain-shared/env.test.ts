import { isTestEnvironment, verifyPackageJsonRequirements } from "@/utils/env.utils";
import { join } from "path";

describe("Env util", () => {
  it("should pass validation", () => {
    const path = __dirname;
    expect(verifyPackageJsonRequirements(path)).toEqual(false);

    const path2 = join(__dirname, "test-data");
    expect(verifyPackageJsonRequirements(path2)).toEqual(true);
  });

  it("environment should be test", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(isTestEnvironment()).toBeTruthy();
  });
});
