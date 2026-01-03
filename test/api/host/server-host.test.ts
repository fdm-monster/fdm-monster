import { AwilixContainer } from "awilix";
import { Test } from "supertest";
import { setupTestApp } from "../../test-server";
import { expectOkResponse } from "../../extensions";
import { DITokens } from "@/container.tokens";
import { AppConstants } from "@/server.constants";
import { ServerHost } from "@/server.host";
import TestAgent from "supertest/lib/agent";

let container: AwilixContainer;
let serverHost: ServerHost;
let request: TestAgent<Test>;

beforeAll(async () => {
  ({ container, request } = await setupTestApp(true, undefined, false));
  serverHost = container.resolve(DITokens.serverHost);
});

describe(ServerHost.name, () => {
  it("should be connected to database", () => {
    expect(serverHost.hasConnected()).toBeTruthy();
  });

  it("should redirect to API docs - skipping history redirect - for /api", async () => {
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
