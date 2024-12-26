import { isDevelopmentEnvironment, isProductionEnvironment, isTestEnvironment } from "@/utils/env.utils";

describe("Env util", () => {
  it("environment should not be development", () => {
    expect(process.env.NODE_ENV).not.toBe("development");
    expect(isDevelopmentEnvironment()).toBeFalsy();
  });

  it("environment should not be production", () => {
    expect(process.env.NODE_ENV).not.toBe("production");
    expect(isProductionEnvironment()).toBeFalsy();
  });

  it("environment should be test", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(isTestEnvironment()).toBeTruthy();
  });
});
