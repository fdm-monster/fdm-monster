import { AwilixContainer } from "awilix";
import supertest from "supertest";
import { connect } from "../../db-handler";
import { setupTestApp } from "../../test-server";
import { expectOkResponse } from "../../extensions";
import { DITokens } from "@/container.tokens";
import { AppConstants } from "@/server.constants";
import { ServerHost } from "@/server.host";

let container: AwilixContainer;
let serverHost: ServerHost;
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  await connect();
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
