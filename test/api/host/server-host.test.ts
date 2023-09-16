import dbHandler = require("../../db-handler");
import { setupTestApp } from "../../test-server";
import { expectOkResponse } from "../../extensions";
import { DITokens } from "@/container.tokens";
import { AppConstants } from "@/server.constants";
import { beforeAll, describe, expect, it } from "@jest/globals";

let container;
let serverHost;
let request;

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
   * The /test endpoint does not exist on the backend, so it's rewritten to /index.html
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
