const dbHandler = require("../../db-handler");
const { setupTestApp } = require("../../test-server");
const DITokens = require("../../../server/container.tokens");

let container;
let serverHost;

beforeAll(async () => {
  await dbHandler.connect();
  ({ container } = await setupTestApp(true));
  serverHost = container.resolve(DITokens.serverHost);
});

describe("ServerHost", () => {
  it("should be connected to mongo", async () => {
    expect(serverHost.hasConnected()).toBeTruthy();
  });
});
