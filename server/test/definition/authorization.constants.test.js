const { allPerms } = require("../../constants/authorization.constants");
describe("authorization constants", () => {
  it("allPerms should throw for unknown permission group", async () => {
    expect(() => allPerms("bla")).toThrow();
  });
});
