import nock from "nock";
import { AwilixContainer } from "awilix";
import { setupTestApp } from "../test-server";
import { expectOkResponse, expectUnauthenticatedResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { DITokens } from "@/container.tokens";
import { loginTestUser } from "./auth/login-test-user";
import githubReleasesResponse from "./test-data/github-releases-server-feb-2022.data.json";
import { ServerReleaseService } from "@/services/core/server-release.service";
import { SettingsStore } from "@/state/settings.store";
import { Test } from "supertest";
import { ServerPublicController } from "@/controllers/server-public.controller";
import TestAgent from "supertest/lib/agent";

let container: AwilixContainer;
let releaseService: ServerReleaseService;
let settingsStore: SettingsStore;
let request: TestAgent<Test>;

const welcomeRoute = AppConstants.apiRoute;
const getRoute = welcomeRoute;
const testRoute = `${welcomeRoute}/test`;
const versionRoute = `${welcomeRoute}/version`;

beforeAll(async () => {
  ({ request, container } = await setupTestApp(true));
  releaseService = container.resolve(DITokens.serverReleaseService);
  settingsStore = container.resolve(DITokens.settingsStore);
});

describe(ServerPublicController.name, () => {
  it("test should work for loginRequired true/false", async function () {
    await settingsStore.setLoginRequired();
    const response = await request.get(testRoute).send();
    expectOkResponse(response);
    await settingsStore.setLoginRequired(false);
    const response2 = await request.get(testRoute).send();
    expectOkResponse(response2);
  });

  it("should not be authorized on /", async function () {
    await settingsStore.setLoginRequired();
    const response = await request.get(getRoute).send();
    expect(response.body).toMatchObject({
      error: "Not authenticated",
    });
    expectUnauthenticatedResponse(response);
    // Return to default
    await settingsStore.setLoginRequired(false);
  });

  it("should get login error", async function () {
    await settingsStore.setLoginRequired();
    const response = await request.get(getRoute).send();
    expect(response.body).toMatchObject({
      error: "Not authenticated",
    });
    expectUnauthenticatedResponse(response);

    // Return to default
    await settingsStore.setLoginRequired(false);
  });

  it("should return welcome message", async function () {
    await settingsStore.setLoginRequired(false);
    const response = await request.get(getRoute).send();
    expect(response.body).toMatchObject({
      message: "Login disabled. Please load the Vue app.",
      apiDocs: "http://localhost:4000/api-docs/",
      swaggerJson: "http://localhost:4000/api-docs/swagger.json",
    });
    expectOkResponse(response);
  });

  it("should get login-based welcome message", async function () {
    await settingsStore.setLoginRequired();

    const { token } = await loginTestUser(request);
    const response = await request.get(getRoute).set("Authorization", `Bearer ${token}`).send();
    expect(response.body).toMatchObject({
      message: "Login required. Please load the Vue app.",
      apiDocs: "http://localhost:4000/api-docs/",
      swaggerJson: "http://localhost:4000/api-docs/swagger.json",
    });
    expectOkResponse(response);

    // Return to default
    await settingsStore.setLoginRequired(false);
  });

  it("should return unsynced state response", async function () {
    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      update: {
        synced: false,
        airGapped: null,
        updateAvailable: null,
      },
    });
  });

  it("should return airGapped response", async function () {
    await releaseService.syncLatestRelease();

    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      update: {
        synced: false,
        airGapped: null,
        updateAvailable: null,
      },
    });
  });

  test.skip("should return update-to-date response", async function () {
    // TODO these dont work yet (octokit undici/native-fetch)
    nock("https://api.github.com").get("/repos/fdm-monster/fdm-monster/releases/").reply(200, githubReleasesResponse);

    await releaseService.syncLatestRelease();

    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      update: {
        airGapped: null,
        synced: false,
        updateAvailable: null, // package.json is respected
      },
    });
  });
});
