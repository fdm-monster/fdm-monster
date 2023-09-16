import { describe, expect, it } from "@jest/globals";
import { allPerms, flattenPermissionDefinition } from "@/constants/authorization.constants";

describe("authorization constants", () => {
  it("allPerms should throw for no permission group", async () => {
    expect(() => allPerms()).toThrow(`Permission group name 'undefined' was not found`);
  });

  it("allPerms should throw for unknown permission group", async () => {
    expect(() => allPerms("123asd")).toThrow(`Permission group name '123asd' was not found`);
  });

  it("flattenPermissionDefinition should work", () => {
    expect(flattenPermissionDefinition()).toBeDefined();
  });
});
