const { isEnvProd } = require("../../../server.env");

describe("ServerEnv", () => {
  it("Expect server ", () => {
    expect(isEnvProd()).toBe(false);
  });
});
