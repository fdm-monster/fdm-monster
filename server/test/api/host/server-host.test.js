const dbHandler = require("../../db-handler");
const { setupTestApp } = require("../../test-server");
const DITokens = require("../../../container.tokens");
const { AppConstants } = require("../../../server.constants");
const { expectOkResponse, expectNotFoundResponse } = require("../../extensions");

let container;
let serverHost;

beforeAll(async () => {
  await dbHandler.connect();
  ({ container, request } = await setupTestApp(true, undefined, false));
  serverHost = container.resolve(DITokens.serverHost);
});

describe("ServerHost", () => {
  it("should be connected to mongo", () => {
    expect(serverHost.hasConnected()).toBeTruthy();
  });

  it("should hit API - skipping history redirect - for /api", async () => {
    const response = await request.get(AppConstants.apiRoute).send();
    expectOkResponse(response);
  });

  /**
   * The /test endpoint does not exist on the backed, so its rewritten to /index.html
   */
  it("should hit history redirect for /test", async () => {
    const response = await request.get("/test").set("Accept", "text/html").send();
    expectOkResponse(response);
  });

  it("should hit static file for /index.html", async () => {
    const response = await request.get("/index.html").send();
    expectOkResponse(response);
  });
});
